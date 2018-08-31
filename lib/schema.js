#! /usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

class Schema {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error('');
        console.error('Fetch Schema (if any) that the server uses to validate features');
        console.error('');
        console.error('usage: cli.js schema');
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

        let args = [];

        if (this.api.auth_rules && this.api.auth_rules.schema.get !== 'public') {
            args = args.concat(auth(this.api.user));
        }

        prompt.get(args, (err, argv) => {
            prompt.stop();

            if (argv.hecate_username) {
                this.api.user = {
                    username: argv.hecate_username,
                    password: argv.hecate_password
                };
            }

            return run(argv);
        });

        function run(argv) {
            self.main(argv, (err, res) => {
                if (err) throw err;

                if (res) {
                    console.log(JSON.stringify(res, null, 4));
                } else {
                    console.error('No Schema Enforcement');
                }
            });
        }
    }

    main(options = {}, cb) {
        if (!options) options = {};

        request.get({
            json: true,
            url: `http://${this.api.url}:${this.api.port}/api/schema`,
            auth: this.api.user
        }, (err, res) => {
            if (err) return cb(err);

            // No schema validation on server
            if (res.statusCode === 404) return cb();

            if (res.statusCode !== 200) return cb(new Error(res.body));

            return cb(null, res);
        });
    }
}

module.exports = Schema;
