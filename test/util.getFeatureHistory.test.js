'use strict';

const getFeatureHistory = require('../util/getFeatureHistory.js');
const test = require('tape').test;
const nock = require('nock');

test('Assert fails per missing arguments', (t) => {
    getFeatureHistory({ port: '1111', url: 'xurl' }, null, (err) => { t.deepEquals(err.message, 'A feature ID is required', 'A feature ID is required'); });
    t.end();
});

test('Assert getting a feature history list', (t) => {
    nock('http://localhost:7777')
        .get('/api/data/feature/7/history')
        .reply(200, 'response is as expected');

    const argv = { url: 'localhost', port: '7777' };

    getFeatureHistory(argv, 7, (err, res) => {
        t.equal(res.statusCode, 200, 'status code is 200');
        t.equal(res.body, 'response is as expected', 'response is as expected');
        t.end();
    });
});

test('Restore Nock', (t) => {
    nock.cleanAll();
    t.end();
});
