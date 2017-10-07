import { PubNub } from './pubnub';
import * as types from './types';
import * as util from 'util';
import * as assert from 'power-assert';

const config = require('../../config/pubnub');

const pubnub = new PubNub(config);

const CHANNEL = Date.now().toString();
const testPublish = () => {

  pubnub.publish(CHANNEL, { result: 'ok' });
};

const testSubscribe = (done: () => {}) => {

  const date = new Date().getTime().toString();

  pubnub.subscribe([CHANNEL], (message: { result: string }, channel: string) => {
    assert(channel === CHANNEL);
    assert(message.result === date);
    console.log('subscribe: ' + util.inspect(message, true, null));
    done();
  }).then(() =>
    pubnub.publish(CHANNEL, { result: date })
    );
};

describe('bb-pubnub-ts', () => {

  it('should do testPublish', testPublish);
  it('should do testSubscribe', function (done) {
    testSubscribe(done);
  });
});
