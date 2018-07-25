'use strict';

module.exports = (auth = {}) => {
    return [{
        name: 'username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: auth.username
    }, {
        name: 'password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string',
        default: auth.password
    }];
};
