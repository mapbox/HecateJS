'use strict';

const Hecate = require('../cli.js');

const test = require('tape').test;
const nock = require('nock');

test('lib.auth.test.js', (t) => {
    nock('http://localhost:7777')
        .get('/api/auth')
        .reply(200, {
            custom: 'auth'
        });

    const hecate = new Hecate({
        url: 'localhost',
        port: '7777'
    });

    hecate.auth(null, (err, res) => {
        t.error(err, 'no error');

        t.deepEquals(res, { custom: 'auth' }, 'returns custom auth json');
        t.end();
    });
});

test('lib.auth.test.js - Restore Nock', (t) => {
    nock.cleanAll();
    t.end();
});
