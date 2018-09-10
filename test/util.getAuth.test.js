'use strict';

const getAuth = require('../util/get_auth.js');
const test = require('tape');

test('util/getAuth', (t) => {
    t.deepEquals(getAuth(), [{
        name: 'hecate_username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: undefined
    },{
        name: 'hecate_password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string',
        default: undefined
    }], 'no auth provided');

    t.deepEquals(getAuth({
        username: 'ingalls'
    }), [{
        name: 'hecate_username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: 'ingalls'
    },{
        name: 'hecate_password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string',
        default: undefined
    }], 'username provided');

    t.deepEquals(getAuth({
        password: 'yeaheh'
    }), [{
        name: 'hecate_username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: undefined
    },{
        name: 'hecate_password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string',
        default: 'yeaheh'
    }], 'password provided');

    t.deepEquals(getAuth({
        username: 'ingalls',
        password: 'yeaheh'
    }), [{
        name: 'hecate_username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: 'ingalls'
    },{
        name: 'hecate_password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string',
        default: 'yeaheh'
    }], 'username & password provided');

    t.end();
});
