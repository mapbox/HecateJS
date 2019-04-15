#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');
const EOT = require('../util/eot');

/**
 * @class Clone
 */
class Clone {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch a complete dataset from the server');
        console.error();
        console.error('Usage: cli.js clone <subcommand>');
        console.error();
        console.error('<subcommand>:');
        console.error('    get      Stream LDgeoJSON of all the data on the server');
        console.error();
    }

    /**
     * Clone all data on a given hecate server
     *
     * @param {!Object} options Options for making a request to the hecate /api/data/features endpoint
     * @param {Stream} [options.output] Stream to write line-delimited GeoJSON to
     *
     * @param {function} cb (err, res) style callback function
     */
    get(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;

            options.output = process.stdout;

            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [];

            if (self.api.auth_rules && self.api.auth_rules.clone.get !== 'public') {
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

                options.output = process.stdout;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.output) return cb(new Error('options.output required'));

            request({
                method: 'GET',
                url: `http://${self.api.url}:${self.api.port}/api/data/clone`,
                auth: self.api.user
            }).on('error', (err) => {
                return cb(err);
            }).on('response', (res) => {
                if (res.statusCode !== 200) return cb(new Error(res.body));
            }).pipe(new EOT(cb)).pipe(options.output);
        }

        function cli(err) {
            if (err) throw err;
        }
    }
}

module.exports = Clone;
