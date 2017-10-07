import * as types from './types';
import * as crypto from 'crypto';
import * as util from 'util';
const PUBNUB = require('pubnub');

class Grant {
  config: types.PriNubOptions;
  pubnub: types.PubNub;

  constructor(config: types.PriNubOptions, pubnub: types.PubNub) {
    this.config = config;
    this.pubnub = pubnub;
  }

  private _grant(opt: types.GrantOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      return opt.pubnub.grant({
        channels: Array.isArray(opt.channel) ? opt.channel : [opt.channel],
        authKeys: Array.isArray(opt.key) ? opt.key : [opt.key],
        ttl: opt.ttl,
        read: opt.read,
        write: opt.write
      }, (status: types.ErrorStatus) => {
        return status.error ? reject(status) : resolve(opt.key.toString());
      });
    });
  }

  createWriteAuthKey(channel: string) {
    return crypto.createHmac('sha256', this.config.salt).update(channel).digest('hex');
  }

  createReadAuthKey(channel: string) {
    return new Promise((resolve, reject) =>
      crypto.randomBytes(32, (e, buf) =>
        e ? reject(e) : resolve(buf)
      )).then((buf: string | Buffer) => {
        return crypto.createHash('sha256')
          .update(buf)
          .digest('hex');
      });
  }

  write(channel: string) {
    const key = this.createWriteAuthKey(channel);
    const grantOpt = {
      pubnub: this.pubnub,
      channel,
      key,
      read: true,
      write: true,
      ttl: this.config.ttl
    };
    return this._grant(grantOpt);
  }

  async read(channel: string) {
    const key = await this.createReadAuthKey(channel);
    const grantOpt = {
      pubnub: this.pubnub,
      channel,
      key,
      read: true,
      write: false,
      ttl: this.config.ttl
    };
    return this._grant(grantOpt);
  }

  revoke(channel: string | string[], key: string | string[]) {
    const grantOpt = {
      pubnub: this.pubnub,
      channel,
      key,
      read: false,
      write: false,
      ttl: 0
    };
    return this._grant(grantOpt);
  }
}

export class PriNub {
  private _opt: types.PriNubOptions;
  private _pubnub: types.PubNub;
  private _grant: Grant;

  constructor(config: types.PriNubOptions) {
    this._opt = config;
    this._pubnub = new PUBNUB({
      publishKey: this._opt.publishKey,
      subscribeKey: this._opt.subscribeKey,
      secretKey: this._opt.secretKey,
      ssl: true,
      keepAlive: true,
      keepAliveSettings: {
        maxSockets: 128,
        timeout: 5000
      },
      error: (e: Error) => {
        throw e;
      }
    });
    this._grant = new Grant(this._opt, this._pubnub);
  }

  async grant(channel: string): Promise<string> {
    const key = await this._grant.read(channel);
    this._grant.write(channel);
    return key;
  }

  async revoke(channel: string | string[], key: string | string[]) {
    return await this._grant.revoke(channel, key);
  }

  publish(channel: string, method: string, params: Object) {
    const message = { method, params: params || {} };
    const key = this._grant.createWriteAuthKey(channel);
    this._pubnub.setAuthKey(key);
    return new Promise((resolve, reject) =>
      this._pubnub.publish({ channel, message },
        (status: types.ErrorStatus) => {
          if (status.error) {
            const e = new Error('PubNub connection error. status.error: ' + util.inspect(status.error, false, null));
            reject(e);
          }
          resolve(key);
        }
      )
    );
  }

  async subscribe(channels: string[], key: string | string[],
    callback: (msg: Object, channel: string, timetoken: number | string) => any) {
    const subnub = new PUBNUB({
      subscribeKey: this._opt.subscribeKey,
      authKey: key,
      ssl: true,
      error: (e: Error) => {
        throw e;
      }
    });
    return new Promise((resolve, reject) => {

      let category: string;
      setTimeout(() => reject(
        new Error('PubNub cannnot connect in 3000. category: ' + category)
      ), 3000);

      const status = (s: types.StatusAnnouncement) => {
        category = s.category;
        if (category === 'PNConnectedCategory') {
          resolve();
        }
      };

      const message = (msg: types.MessageAnnouncement) => {
        if (channels.some(channel => channel === msg.channel)) {
          return Promise.resolve()
            .then(() => callback(msg.message, msg.channel, msg.timetoken));
        }
      };

      subnub.addListener({ status, message });
      subnub.subscribe({ channels });
    });
  }
}
