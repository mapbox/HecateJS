'use strict';

const getDelta = require('../util/getDelta.js');
const test = require('tape').test;
const nock = require('nock');

test('Assert fails per missing arguments', (t) => {
  t.throws(() => { getDelta({ port: '1111', deltaId: 1 }, () => {}); }, /URL is required/, 'URL is required');
  t.throws(() => { getDelta({ url: 'xurl', deltaId: 1 }, () => {}); }, /A port is required/, 'A port is required');
  t.throws(() => { getDelta({ port: '1111', url: 'xurl' }, () => {}); }, /A deltaId is required/, 'A deltaId is required');
  t.end();
});

test('Assert obtaining delta according to ID', (t) => {
  nock('http://localhost:7777')
    .get('/api/delta/1')
    .reply(200, 'response is as expected');
  const argv = { url: 'localhost', port: '7777', deltaId: 1 };

  getDelta(argv, (res) => {
    t.equal(res.body, 'response is as expected', 'response is as expected');
    t.end();
  });
});
