import { PriNub } from './prinub';
import * as assert from 'power-assert';

const config = require('../../config/prinub');

const prinub = new PriNub(config);

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
  await new Promise(resolve => setTimeout(resolve, 1000));
  const pubkey = await prinub.publish(channel, 'test1', { result: 'ok' });
  console.log('revoke: ' + pubkey);
};

const testSubscribe = async (done: any) => {

  const _channel = new Date().getTime().toString();
  const key = await prinub.grant(_channel);
  await new Promise(resolve => setTimeout(resolve, 1000));

  await prinub.subscribe([_channel], [key], (msg: any, channel: string) => {
    assert(channel === _channel);
    assert(msg);
    assert(msg.method === 'test2');
    assert(msg.params && msg.params.result === 'ok');
    console.log('message: ', msg);
  });
  console.log('publish: ', key);
  await prinub.publish(_channel, 'test2', { result: 'ok' });

  console.log('revoke: ', key);
  await prinub.revoke(_channel, key);
  done();
};

describe('bb-pubnub-ts', () => {

  it('should do testGrant', testGrant);
  it('should do testPublish', testPublish);
  it('should do testSubscribe', function (done) {
    testSubscribe(done);
  });
});
