import { PriNub } from './prinub';
import * as assert from 'power-assert';

const config = require('../../config/config');

const prinub = new PriNub(config.prinub);

const testGrant = async () => {

  const channel = new Date().getTime().toString();
  const key = await prinub.grant(channel);
  console.log('key: ' + key);
  assert(key.length === 64);
  return await prinub.revoke(channel, key);
};

const testPublish = async () => {

  const channel = new Date().getTime().toString();
  const key = await prinub.grant(channel);
  const pubkey = await prinub.publish(channel, 'test1', { result: 'ok' });
  console.log('发布key: ' + pubkey);
};

const testSubscribe = async (done: any) => {

  const _channel = new Date().getTime().toString();
  const key = await prinub.grant(_channel);
  await prinub.subscribe([_channel], [key], (msg: any, channel: string) => {
    assert(channel === _channel);
    assert(msg);
    assert(msg.method === 'test2');
    assert(msg.params && msg.params.result === 'ok');
    console.log('message: ', msg);
  });
  console.log('授权: ', key);
  await prinub.publish(_channel, 'test2', { result: 'ok' });

  console.log('撤销授权: ', key);
  await prinub.revoke(_channel, key);
  done();
};

describe('prinub', () => {

  it('测试授权', testGrant);
  it('测试发布', testPublish);
  it('测试订阅', function (done) {
    testSubscribe(done);
  });
});
