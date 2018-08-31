#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

class Query {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch raw data from the server using the bounds API');
        console.error();
        console.error('Usage: cli.js bounds <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    get      Download geometries within a given bounds');
        console.error();
    }

    cli(options = {}) {
    }

    /**
     * Return a list of the bounds that are currently loaded on the server
     *
     * @param {!Object} options options for makign a query to the bounds list endpoint
     *
     * @param {function} cb (err, res) style callback function
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

            let args = [];

            if (self.api.auth_rules && self.api.auth_rules.bounds.list !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                if (err) throw err;

                prompt.stop();

                if (argv.username) {
                    self.api.user = {
                        username: argv.username,
                        password: argv.password
                    };
                }

                return main();
            });
        } else {
            return main();
        }

        function main() {
            request({
                method: 'GET',
                json: true,
                url: `http://${self.api.url}:${self.api.port}/api/data/bounds`,
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(res.body));

                return cb(null, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }

    /**
     * Queries the /api/data/bounds endpoints, returning a
     * line-delimited stream of GeoJSON Features
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.bound] Name of the bound to download from
     * @param {Stream} [options.output] Stream to write line-delimited GeoJSON to
     *
     * @param {function} cb (err, res) style callback function
     */
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

            let args = [{
                name: 'bound',
                message: 'bbox to download',
                required: true,
                type: 'string',
                default: options.bound
            }];

            if (self.api.auth_rules && self.api.auth_rules.bounds.get !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                if (err) throw err;

                prompt.stop();

                if (argv.username) {
                    self.api.user = {
                        username: argv.username,
                        password: argv.password
                    };
                }

                options.output = process.stdout;
                options.bound = argv.bound;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.bound) return cb(new Error('options.bound required'));
            if (!options.output) return cb(new Error('options.output required'));

            request({
                method: 'GET',
                url: `http://${self.api.url}:${self.api.port}/api/data/bounds/${options.bound}`,
                auth: self.api.user
            }).on('error', (err) => {
                return cb(err);
            }).on('response', (res) => {
                if (res.statusCode !== 200) return cb(new Error('Non-200 status code'));
            }).pipe(options.output);
        }

        function cli(err) {
            if (err) throw err;
        }
    }
}

module.exports = Query;
