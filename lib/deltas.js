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
    /**
     * Create a new Deltas Instance
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
     * @param {String} [options.offset] delta id to start listing at
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
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
            }, {
                name: 'offset',
                message: 'delta id to start listing at',
                required: false,
                type: 'string'
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.delta.list !== 'public') {
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
                options.offset = argv.offset || null;

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
            if (!options.limit) options.limit = 100;
            const query = options.offset ?
                `/api/deltas?limit=${options.limit}&offset=${options.offset}`
                : `/api/deltas?limit=${options.limit}`;
            request({
                json: true,
                method: 'GET',
                url: new URL(query, self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(err, res.body);
            });
        }

        /**
         * If in CLI mode, write results to stdout
         * or throw any errors incurred
         *
         * @private
         *
         * @param {Error} err [optional] API Error
         * @param {Object} deltas list of deltas
         *
         * @returns {undefined}
         */
        function cli(err, deltas) {
            if (err) throw err;

            console.log(JSON.stringify(deltas, null, 4));
        }
    }

    /**
     * Returns data about a specific delta
     *
     * @param {!Object} options Options for making a request to the deltas endpoint
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
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

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.delta.list !== 'public') {
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

        /**
         * Once the options object is populated, make the API request
         * @private
         *
         * @returns {undefined}
         */
        function main() {
            if (!options.delta) return cb(new Error('options.delta required'));

            request({
                json: true,
                method: 'GET',
                url: new URL(`/api/delta/${options.delta}`, self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(err, res.body);
            });
        }

        /**
         * If in CLI mode, write results to stdout
         * or throw any errors incurred
         *
         * @private
         *
         * @param {Error} err [optional] API Error
         * @param {Object} delta delta object
         *
         * @returns {undefined}
         */
        function cli(err, delta) {
            if (err) throw err;

            console.log(JSON.stringify(delta, null, 4));
        }
    }
}

module.exports = Deltas;
