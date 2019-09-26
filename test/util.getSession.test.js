'use strict';

const getSession = require('../util/getSession');
const test = require('tape').test;
const nock = require('nock');

test('Assert fails per missing arguments', (t) => {
    getSession({ password: 'psw', url: 'url' }, (err) => { t.deepEquals(err.message, 'username is required', 'username is required'); });
    getSession({ username: 'user', url: 'url' }, (err) => { t.deepEquals(err.message, 'password is required', 'password is required'); });
    getSession({ username: 'user', password: 'psw' }, (err) => { t.deepEquals(err.message, 'URL is required', 'URL is required'); });
    t.end();
});

test('Assert obtaining session info', (t) => {
    nock('http://localhost:7777')
        .get('/api/user/session')
        .reply(200, 'response is as expected');

    getSession({ username: 'username', password: 'psw', url: 'http://localhost:7777' }, (err, res) => {
        t.equal(res.body, 'response is as expected', 'response is as expected');
        t.end();
    });
});

test('Restore Nock', (t) => {
    nock.cleanAll();
    t.end();
});
