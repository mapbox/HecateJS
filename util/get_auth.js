'use strict';

module.exports = (options = {}) => {
    return [{
        name: 'username',
        message: 'Your Slack/Github Username',
        type: 'string',
        required: true,
        default: options.username
    }, {
        name: 'password',
        message: 'secure password to be used at login',
        hidden: true,
        replace: '*',
        required: true,
        type: 'string'
    }];
};
