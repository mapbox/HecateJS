#! /usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

class Register {

    constructor(api) {
        this.api = api;
    }

    help() {
        console.error('');
        console.error('Register a new user account with the server');
        console.error('');
        console.error('usage: cli.js register');
        console.error('');
    }

    cli(options = {}) {
        const self = this;

        if (!options) options = {};

        if (options.script) return run(options);

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

        if (this.api.auth_rules && this.api.auth_rules.bounds.get !== 'public') {
            args = args.concat(auth(this.api.user));
        }

        prompt.get(args, (err, argv) => {
            prompt.stop();

            if (argv.username) {
                this.api.user = {
                    username: argv.username,
                    password: argv.password
                };
            }

            return run(argv);
        });

        function run(argv) {
            self.main({
                username: argv.username,
                email: argv.email,
                password: argv.password
            }, (err) => {
                if (err) throw err;

                console.error('ok - created user');
            });
        }
    }

    main(options = {}, cb) {
        if (!options) options = {};

        if (!options.username) return cb(new Error('options.username required'));
        if (!options.password) return cb(new Error('options.password required'));
        if (!options.email) return cb(new Error('options.email required'));

        options.username = encodeURIComponent(options.username);
        options.password = encodeURIComponent(options.password);
        options.email = encodeURIComponent(options.email);

        request.get({
            url: `http://${this.api.url}:${this.api.port}/api/user/create?username=${options.username}&password=${options.password}&email=${options.email}`,
            auth: this.api.user
        }, (err, res) => {
            if (err) return cb(err);
            if (res.statusCode !== 200) {
                const error = new Error(res.body);
                error.status = res.statusCode;
                return cb(error);
            }

            return cb(null, true);
        });
    }
}

module.exports = Register;
