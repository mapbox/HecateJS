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
    /**
     * Create a new Schema Instance
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
        console.error('Fetch Schema (if any) that the server uses to validate features');
        console.error();
        console.error('Usage: cli.js schema <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    get      Get the server schema');
        console.error();
    }

    /**
     * Retrieve a JSON schema that feature properties must conform to
     *
     * @param {Object} options options object
     * @param {function} cb (err, res) style callback
     *
     * @returns {function} (err, res) style callback
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

        /**
         * Once the options object is populated, make the API request
         * @private
         *
         * @returns {undefined}
         */
        function main() {
            request.get({
                json: true,
                url: new URL('/api/schema', self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);

                // No schema validation on server
                if (res.statusCode === 404) return cb();
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
         * @param {Object} schema JSON Schema
         *
         * @returns {undefined}
         */
        function cli(err, schema) {
            if (err) throw err;

            if (schema) {
                console.log(JSON.stringify(schema, null, 4));
            } else {
                console.error('No Schema Enforcement');
            }
        }
    }
}

module.exports = Schema;
