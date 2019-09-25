#! /usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

/**
 * @class Schema
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#schema|Hecate Documentation}
 */
class Schema {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch Schema (if any) that the server uses to validate features');
        console.error();
        console.error('Usage: cli.js schema <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    get      Get the server schema');
        console.error();
    }

    get(options = {}, cb) {
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

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.schema.get !== 'public') {
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
                url: `${self.api.url}/api/schema`,
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);

                // No schema validation on server
                if (res.statusCode === 404) return cb();
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, res);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            if (res) {
                console.log(JSON.stringify(res, null, 4));
            } else {
                console.error('No Schema Enforcement');
            }
        }
    }
}

module.exports = Schema;
