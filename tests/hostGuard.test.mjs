import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedHostHeader, isAllowedOrigin, isLoopbackHost as guardLoopback } from '../server/hostGuard.ts';
import { isNetworkBindAllowed, isLoopbackHost } from '../server/listenHost.ts';

test('Host header: loopback names with or without a port are accepted', () => {
  for (const h of ['127.0.0.1:47321', '127.0.0.1', 'localhost:3000', 'LOCALHOST', '[::1]:3000', '[::1]']) {
    assert.equal(isAllowedHostHeader(h), true, h);
  }
});

test('Host header: DNS-rebinding and look-alike hosts are rejected', () => {
  for (const h of ['evil.com', 'evil.com:3000', 'localhost.evil.com', '127.0.0.1.evil.com:80',
    '192.168.1.5:3000', '0.0.0.0:3000', '', undefined, 'localhost@evil.com', 'localhost:abc']) {
    assert.equal(isAllowedHostHeader(h), false, String(h));
  }
});

test('Origin: absent is fine (same-origin/non-browser), loopback accepted, others rejected', () => {
  assert.equal(isAllowedOrigin(undefined), true);
  for (const o of ['http://127.0.0.1:47321', 'http://localhost:3000', 'http://[::1]:3000']) {
    assert.equal(isAllowedOrigin(o), true, o);
  }
  for (const o of ['https://evil.com', 'http://localhost.evil.com', 'null', 'file://', 'http://192.168.1.5:3000', 'not a url']) {
    assert.equal(isAllowedOrigin(o), false, o);
  }
});

test('network bind needs an explicit ALLOW_NETWORK_BIND=1', () => {
  assert.equal(isNetworkBindAllowed({}), false);
  assert.equal(isNetworkBindAllowed({ ALLOW_NETWORK_BIND: '0' }), false);
  assert.equal(isNetworkBindAllowed({ ALLOW_NETWORK_BIND: 'true' }), false);
  assert.equal(isNetworkBindAllowed({ ALLOW_NETWORK_BIND: '1' }), true);
  assert.equal(isNetworkBindAllowed({ ALLOW_NETWORK_BIND: ' 1 ' }), true);
});

test('both isLoopbackHost copies agree', () => {
  for (const h of ['127.0.0.1', '127.1', '::1', '[::1]', 'localhost', 'LOCALHOST', '0.0.0.0', '::', 'example.com', '127.0.0.1.evil.com', '']) {
    assert.equal(guardLoopback(h), isLoopbackHost(h), h);
  }
});
