#! /usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

/**
 * @class User
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#user-options|Hecate Documentation}
 */
class User {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Manage user information');
        console.error();
        console.error('usage: cli.js user <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    register     Register a new user account');
        console.error('    info         Get info about your own account');
        console.error('    list         List users wth an optional filter prefix');
        console.error();
    }

    list(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;
            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [{
                name: 'filter',
                message: 'Optional filter prefix',
                type: 'string',
                required: false,
                default: options.filter
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.user.list !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                prompt.stop();

                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                options.filter = argv.filter;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            options.filter = options.filter ? encodeURIComponent(options.filter) : '';

            request.get({
                json: true,
                url: `http://${self.api.url}:${self.api.port}/api/users?filter=${options.filter}`,
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }

    info(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;
            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.user.info !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                prompt.stop();

                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                return main();
            });
        } else {
            return main();
        }

        function main() {
            request.get({
                json: true,
                url: `http://${self.api.url}:${self.api.port}/api/user/info`,
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }

    register(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;
            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [{
                name: 'username',
                message: 'Your Slack/Github Username',
                type: 'string',
                required: true,
                default: options.username
            }, {
                name: 'email',
                message: 'Your email address',
                type: 'string',
                required: true,
                default: options.email
            }, {
                name: 'password',
                message: 'secure password to be used at login',
                hidden: true,
                replace: '*',
                required: true,
                type: 'string'
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.user.create !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                prompt.stop();

                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                options.username = argv.username;
                options.email = argv.email;
                options.password = argv.password;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.username) return cb(new Error('options.username required'));
            if (!options.password) return cb(new Error('options.password required'));
            if (!options.email) return cb(new Error('options.email required'));

            options.username = encodeURIComponent(options.username);
            options.password = encodeURIComponent(options.password);
            options.email = encodeURIComponent(options.email);

            request.get({
                url: `http://${self.api.url}:${self.api.port}/api/user/create?username=${options.username}&password=${options.password}&email=${options.email}`,
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, true);
            });
        }

        function cli(err) {
            if (err) throw err;

            console.log('ok - user registered');
        }
    }
}

module.exports = User;
