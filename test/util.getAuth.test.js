'use strict';

const getAuth = require('../util/get_auth.js');
const test = require('tape');

test('util/getAuth', (t) => {
    t.deepEquals(getAuth(), [{
        name: 'username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: undefined
    },{
        name: 'password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string',
        default: undefined
    }], 'no auth provided')

    t.deepEquals(getAuth({
        username: 'ingalls' 
    }), [{
        name: 'username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: 'ingalls'
    },{
        name: 'password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string',
        default: undefined
    }], 'username provided')

    t.deepEquals(getAuth({
        password: 'yeaheh' 
    }), [{
        name: 'username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: undefined
    },{
        name: 'password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string',
        default: 'yeaheh'
    }], 'password provided')

    t.deepEquals(getAuth({
        username: 'ingalls',
        password: 'yeaheh' 
    }), [{
        name: 'username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: 'ingalls'
    },{
        name: 'password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string',
        default: 'yeaheh'
    }], 'username & password provided')

    t.end();
});
