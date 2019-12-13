'use strict';

const Hecate = require('../cli.js');

const test = require('tape').test;
const nock = require('nock');

test('lib.feature.test.js', (t) => {
    const hecate = new Hecate({
        url: 'http://localhost:7777'
    });

    nock('http://localhost:7777')
        .get('/api/data/feature/7/history')
        .reply(200, true);

    hecate.getFeatureHistory({
        feature: 7
    }, (err, res) => {
        t.error(err);
        t.equal(res, true);
        t.end();
    });
});

test('Restore Nock', (t) => {
    nock.cleanAll();
    t.end();
});
