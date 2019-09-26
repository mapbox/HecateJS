'use strict';

const Hecate = require('../cli.js');

const test = require('tape').test;
const nock = require('nock');

test('lib.register.test.js', (t) => {
    nock('http://localhost:7777')
        .get('/api/user/create?username=ingalls&password=yeaheh&email=nick%40mapbox.com')
        .reply(200, true);

    const hecate = new Hecate({
        url: 'http://localhost:7777'
    });

    t.test('lib.register.test.js - missing username', (q) => {
        hecate.register(null, (err) => {
            q.equals(err.message, 'options.username required');
            q.end();
        });
    });

    t.test('lib.register.test.js - missing password', (q) => {
        hecate.register({
            username: 'ingalls'
        }, (err) => {
            q.equals(err.message, 'options.password required');
            q.end();
        });
    });

    t.test('lib.register.test.js - missing email', (q) => {
        hecate.register({
            username: 'ingalls',
            password: 'yeaheh'
        }, (err) => {
            q.equals(err.message, 'options.email required');
            q.end();
        });
    });

    t.test('lib.register.test.js - missing email', (q) => {
        hecate.register({
            username: 'ingalls',
            password: 'yeaheh',
            email: 'nick@mapbox.com'
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
