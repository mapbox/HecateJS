#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

/**
 * @class Deltas
 * @public
 *
 * @see {@link https://github.com/mapbox/api-geocoder/pull/2634#issuecomment-481255528|Hecate Documentation}
 */
class Deltas {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch a list of deltas or information about a single delta');
        console.error();
        console.error('usage: cli.js delta <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    list     List recent deltas');
        console.error('    get      Get information about a particular delta');
    }

    /**
     * Queries the recent deltas list, returning the most recent 100 deltas
     *
     * @param {!Object} options Options for making a request to the deltas endpoint
     * @param {String} [options.limit=100] Number of deltas to list by default
     *
     * @param {function} cb (err, res) style callback function
     */
    list(options = {}, cb) {
        const self = this;

        if (!options.limit) options.limit = 100;

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
                name: 'limit',
                message: 'number of deltas to retrieve',
                required: true,
                type: 'string',
                default: options.limit
            }];

            if (self.api.auth_rules && self.api.auth_rules.delta.list !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                if (err) throw err;

                prompt.stop();

                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                options.limit = argv.limit;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.limit) options.limit = 100;

            request({
                json: true,
                method: 'GET',
                url: `http://${self.api.url}:${self.api.port}/api/deltas?limit=${options.limit}`,
                auth: self.api.user
            }, (err, res) => {
                if (res.statusCode !== 200) return cb(new Error(res.body));

                return cb(err, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }

    /**
     * Returns data about a specific delta
     *
     * @param {!Object} options Options for making a request to the deltas endpoint
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
                name: 'delta',
                message: 'ID of delta to retrieve',
                required: true,
                type: 'string',
                default: options.delta
            }];

            if (self.api.auth_rules && self.api.auth_rules.delta.list !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                if (err) throw err;

                prompt.stop();

                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                options.delta = argv.delta;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.delta) return cb(new Error('options.delta required'));

            request({
                json: true,
                method: 'GET',
                url: `http://${self.api.url}:${self.api.port}/api/delta/${options.delta}`,
                auth: self.api.user
            }, (err, res) => {
                if (res.statusCode !== 200) return cb(new Error(res.body));

                return cb(err, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }
}

module.exports = Deltas;
