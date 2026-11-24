import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveListenHost, isLoopbackHost, DEFAULT_LISTEN_HOST } from '../server/listenHost.ts';

test('HOST unset, empty or blank defaults to 127.0.0.1 and is loopback', () => {
  for (const env of [{}, { HOST: undefined }, { HOST: '' }, { HOST: '   ' }]) {
    assert.deepEqual(resolveListenHost(env), { host: '127.0.0.1', isLoopback: true });
  }
  assert.equal(DEFAULT_LISTEN_HOST, '127.0.0.1');
});

test('HOST=0.0.0.0 is honoured and flagged as non-loopback', () => {
  assert.deepEqual(resolveListenHost({ HOST: '0.0.0.0' }), { host: '0.0.0.0', isLoopback: false });
});

test('loopback spellings are recognised', () => {
  for (const h of ['127.0.0.1', '127.0.0.2', '::1', '[::1]', 'localhost', 'LOCALHOST']) {
    assert.equal(isLoopbackHost(h), true, h);
    assert.equal(resolveListenHost({ HOST: h }).isLoopback, true, h);
  }
});

test('LAN, wildcard and look-alike hosts are not loopback', () => {
  for (const h of ['192.168.1.20', '::', '0.0.0.0', 'example.com', '127.0.0.1.evil.com', '1270.0.0.1']) {
    assert.equal(isLoopbackHost(h), false, h);
  }
});

test('surrounding whitespace in HOST is trimmed', () => {
  assert.deepEqual(resolveListenHost({ HOST: ' 0.0.0.0 ' }), { host: '0.0.0.0', isLoopback: false });
});
