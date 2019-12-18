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
    /**
     * Create a new User Instance
     *
     * @param {Hecate} api parent hecate instance
     */
    constructor(api) {
        this.api = api;
    }

    /**
     * Print help documentation about the subcommand to stderr
     */
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

    /**
     * List users with optional filtering
     *
     * @param {Object} options Options object
     * @param {string} options.filter User prefix to filter by
     * @param {function} cb (err, res) style callback
     *
     * @returns {function} (err, res) style callback
     */
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

        /**
         * Once the options object is populated, make the API request
         * @private
         *
         * @returns {undefined}
         */
        function main() {
            options.filter = options.filter ? encodeURIComponent(options.filter) : '';

            request.get({
                json: true,
                url: new URL(`/api/users?filter=${options.filter}`, self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, res.body);
            });
        }

        /**
         * If in CLI mode, write results to stdout
         * or throw any errors incurred
         *
         * @private
         *
         * @param {Error} err [optional] API Error
         * @param {Object} users list of users
         *
         * @returns {undefined}
         */
        function cli(err, users) {
            if (err) throw err;

            console.log(JSON.stringify(users, null, 4));
        }
    }

    /**
     * Retrieve metadata about the user that makes the request
     *
     * @param {Object} options options object
     * @param {function} cb (err, res) style callback
     *
     * @returns {function} (err, res) style callback
     */
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

        /**
         * Once the options object is populated, make the API request
         * @private
         *
         * @returns {undefined}
         */
        function main() {
            request.get({
                json: true,
                url: new URL('/api/user/info', self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, res.body);
            });
        }

        /**
         * If in CLI mode, write results to stdout
         * or throw any errors incurred
         *
         * @private
         *
         * @param {Error} err [optional] API Error
         * @param {Object} info user info
         *
         * @returns {undefined}
         */
        function cli(err, info) {
            if (err) throw err;

            console.log(JSON.stringify(info, null, 4));
        }
    }

    /**
     * Register a new user account
     *
     * @param {Object} options options object
     * @param {string} options.username Username to register
     * @param {string} options.email Email of account to register
     * @param {string} options.password Password of account to register
     * @param {function} cb (err, res) style callback
     *
     * @returns {function} (err, res) style callback
     */
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

        /**
         * Once the options object is populated, make the API request
         * @private
         *
         * @returns {undefined}
         */
        function main() {
            if (!options.username) return cb(new Error('options.username required'));
            if (!options.password) return cb(new Error('options.password required'));
            if (!options.email) return cb(new Error('options.email required'));

            options.username = encodeURIComponent(options.username);
            options.password = encodeURIComponent(options.password);
            options.email = encodeURIComponent(options.email);

            request.get({
                url: new URL(`/api/user/create?username=${options.username}&password=${options.password}&email=${options.email}`, self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, true);
            });
        }

        /**
         * If in CLI mode, write results to stdout
         * or throw any errors incurred
         *
         * @private
         *
         * @param {Error} err [optional] API Error
         *
         * @returns {undefined}
         */
        function cli(err) {
            if (err) throw err;

            console.log('ok - user registered');
        }
    }
}

module.exports = User;
