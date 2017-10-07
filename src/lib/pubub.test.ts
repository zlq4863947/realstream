import { PubNub } from './pubnub';
import * as types from './types';
import * as util from 'util';
import * as assert from 'power-assert';

const config = require('../../config/config');

const pubnub = new PubNub(config.pubnub);

const CHANNEL = Date.now().toString();
const testPublish = () => {

  pubnub.publish(CHANNEL, { result: '成功' });
};

const testSubscribe = (done: () => {}) => {

  const date = new Date().getTime().toString();

  pubnub.subscribe([CHANNEL], (message: { result: string }, channel: string) => {
    assert(channel === CHANNEL);
    assert(message.result === date);
    console.log('订阅: ' + util.inspect(message, true, null));
    done();
  }).then(() =>
    pubnub.publish(CHANNEL, { result: date })
    );
};

describe('pubnub', () => {

  it('测试发布', testPublish);
  it('测试订阅', function (done) {
    testSubscribe(done);
  });
});
