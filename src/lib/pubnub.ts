import * as assert from 'power-assert';
import * as types from './types';
const PUBNUB = require('pubnub');

export class PubNub {
  private _opt: types.PubNubOptions;
  private _pubnub: types.PubNub;

  constructor(config: types.PubNubOptions) {
    this._opt = config;
    this._pubnub = new PUBNUB(
      Object.assign({
        subscribeKey: this._opt.subscribeKey,
        ssl: true,
        keepAlive: true,
        keepAliveSettings: {
          maxSockets: 128,
          timeout: 5000
        },
        error: (e: Error) => {
          throw e;
        }
      },
        this._opt.publishKey ? { publishKey: this._opt.publishKey } : {})
    );
  }

  publish(channel: string, message: Object) {
    return new Promise((resolve, reject) =>
      this._pubnub.publish({ channel, message },
        (status: types.ErrorStatus) => {
          status.error ? reject(status) : resolve(status);
        }
      )
    );
  }
  
  async subscribe(channels: string[], callback: any) {
    await this._pubnub.addListener({
      status: (s: types.StatusAnnouncement) => {
        if (s.error) {
          throw new Error(s.errorData.stack);
        }
        return false;
      },
      message: (msg: types.MessageAnnouncement) =>
        channels.some(channel => channel === msg.channel) ?
          Promise.resolve()
            .then(() => callback(msg.message, msg.channel, msg.timetoken)) : undefined
    });
    await this._pubnub.subscribe({ channels });
    setTimeout(() => { throw new Error('subscribe timeout') }, 3000);
  }
}
