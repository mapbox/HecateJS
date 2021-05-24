#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');
const EOT = require('../util/eot');

/**
 * @class Query
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#downloading-via-query|Hecate Documentation}
 */
class Query {
    /**
     * Create a new Query Instance
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
        console.error('Fetch data matching a SQL query from the server');
        console.error();
        console.error('Usage: cli.js query <subcommand>');
        console.error();
        console.error('<subcommand>:');
        console.error('    get      Stream LDgeoJSON of the data matching the SQL query');
        console.error();
    }

    /**
     * Query data on a given hecate server
     *
     * @param {!Object} options Options for making a request to the hecate /api/data/features endpoint
     * @param {Stream} [options.output] Stream to write line-delimited GeoJSON to
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
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

            let args = [{
                name: 'query',
                message: 'SQL query',
                required: true,
                type: 'string',
                default: options.query
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.query.get !== 'public') {
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

                options.query = argv.query;
                options.output = process.stdout;

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
            if (!options.query) return cb(new Error('options.query required'));
            if (!options.output) return cb(new Error('options.output required'));

            request({
                method: 'GET',
                url: new URL('/api/data/query', self.api.url),
                qs: { query: options.query },
                auth: self.api.user
            }).on('error', (err) => {
                return cb(err);
            }).on('response', (res) => {
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));
            }).pipe(new EOT(cb)).pipe(options.output);
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
        }
    }
}

module.exports = Query;
