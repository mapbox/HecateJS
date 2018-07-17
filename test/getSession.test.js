'use strict';

const getSession = require('../util/getSession');
const test = require('tape').test;
const nock = require('nock');

test('Assert fails per missing arguments', (t) => {
    getSession({ password: 'psw', port: '1111', url: 'url' }, (err) => { t.deepEquals(err.message, 'username is required', 'username is required'); });
    getSession({ username: 'user', port: '1111', url: 'url' }, (err) => { t.deepEquals(err.message, 'password is required', 'password is required'); });
    getSession({ username: 'user', password: 'psw', port: '1111' }, (err) => { t.deepEquals(err.message, 'URL is required', 'URL is required'); });
    getSession({ username: 'user', password: 'psw', url: 'url' }, (err) => { t.deepEquals(err.message, 'port is required', 'port is required'); });
    t.end();
});

test('Assert obtaining session info', (t) => {
    nock(/url:7777/)
        .get('/api/user/session')
        .reply(200, 'response is as expected');

    const options = { username: 'username', password: 'psw', url: 'url', port: '7777' };

    getSession(options, (err, res) => {
        t.equal(res.body, 'response is as expected', 'response is as expected');
        t.end();
    });
});
