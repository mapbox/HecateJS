'use strict';

const getDelta = require('../util/getDelta.js');
const test = require('tape').test;
const nock = require('nock');

test('Assert fails per missing arguments', (t) => {
    getDelta({ deltaId: 1 }, (err) => { t.deepEquals(err.message, 'URL is required', 'URL is required'); });
    getDelta({ url: 'xurl' }, (err) => { t.deepEquals(err.message, 'A deltaId is required', 'A deltaId is required'); });
    t.end();
});

test('Assert obtaining delta according to ID', (t) => {
    nock('http://localhost:7777')
        .get('/api/delta/1')
        .reply(200, 'response is as expected');

    getDelta({
        url: 'http://localhost:7777',
        deltaId: 1
    }, (err, res) => {
        t.equal(res.body, 'response is as expected', 'response is as expected');
        t.end();
    });
});

test('Restore Nock', (t) => {
    nock.cleanAll();
    t.end();
});
