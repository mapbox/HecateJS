'use strict';

const Hecate = require('../cli.js');

const test = require('tape').test;
const nock = require('nock');

test('lib.deltas.test.js', (t) => {
    const hecate = new Hecate({
        url: 'http://localhost:7777'
    });

    nock('http://localhost:7777')
        .get('/api/deltas?limit=100')
        .reply(200, true);

    t.test('lib.deltas.test.js - default', (q) => {
        hecate.listDeltas({}, (err, res) => {
            q.error(err, 'no errors');
            q.equals(res, true);
            q.end();
        });
    });

    nock('http://localhost:7777')
        .get('/api/deltas?limit=1')
        .reply(200, true);

    t.test('lib.deltas.test.js - custom limit', (q) => {
        hecate.listDeltas({
            limit: 1
        }, (err, res) => {
            q.error(err, 'no errors');
            q.equals(res, true);
            q.end();
        });
    });

    nock('http://localhost:7777')
        .get('/api/deltas?limit=1&offset=1')
        .reply(200, true);

    t.test('lib.deltas.test.js - custom offset', (q) => {
        hecate.listDeltas({
            limit: 1,
            offset: 1
        }, (err, res) => {
            q.error(err, 'no errors');
            q.equals(res, true);
            q.end();
        });
    });

    t.end();
});

test('Restore Nock', (t) => {
    nock.cleanAll();
    t.end();
});
