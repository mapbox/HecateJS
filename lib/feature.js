#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

/**
 * @class Feature
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#downloading-individual-features|Hecate Documentation}
 */
class Feature {
    /**
     * Create a new Feature Instance
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
        console.error('Fetch an individual feature and it\'s corresponding metadata');
        console.error();
        console.error('usage: cli.js feature <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    get      Download an individual feature by ID');
        console.error('    key      Download an individual feature by key');
        console.error('    history  Download the history of a feature by ID');
    }

    /**
     * Queries the feature store endpoint, returning a history of a
     * GeoJSON Feature
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.feature] ID of the feature to download from
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
     */
    history(options = {}, cb) {
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
                name: 'feature',
                message: 'feature id to download',
                required: true,
                type: 'string',
                default: options.feature
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.feature.get !== 'public') {
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

                options.feature = argv.feature;

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
            if (!options.feature) return cb(new Error('options.feature required'));

            request({
                json: true,
                method: 'GET',
                url: new URL(`/api/data/feature/${options.feature}/history`, self.api.url),
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
         * @param {Object} history history of the feature
         *
         * @returns {undefined}
         */
        function cli(err, history) {
            if (err) throw err;

            console.log(JSON.stringify(history, null, 4));
        }
    }

    /**
     * Queries the feature store endpoint by key, returning a
     * GeoJSON Feature
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.feature] key of the feature to download from
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
     */
    key(options = {}, cb) {
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
                name: 'feature',
                message: 'feature key to download',
                required: true,
                type: 'string',
                default: options.feature
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.feature.get !== 'public') {
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

                options.feature = argv.feature;

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
            if (!options.feature) return cb(new Error('options.feature required'));

            request({
                json: true,
                method: 'GET',
                url: new URL(`/api/data/feature?key=${encodeURIComponent(options.feature)}`, self.api.url),
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
         * @param {Object} feature requested feature
         *
         * @returns {undefined}
         */
        function cli(err, feature) {
            if (err) throw err;

            console.log(JSON.stringify(feature, null, 4));
        }
    }

    /**
     * Queries the feature store endpoint, returning a
     * GeoJSON Feature
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.feature] ID of the feature to download from
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
                name: 'feature',
                message: 'feature id to download',
                required: true,
                type: 'string',
                default: options.feature
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.feature.get !== 'public') {
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

                options.feature = argv.feature;

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
            if (!options.feature) return cb(new Error('options.feature required'));

            request({
                json: true,
                method: 'GET',
                url: new URL(`/api/data/feature/${options.feature}`, self.api.url),
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
         * @param {Object} feature requested feature
         *
         * @returns {undefined}
         */
        function cli(err, feature) {
            if (err) throw err;

            console.log(JSON.stringify(feature, null, 4));
        }
    }
}

module.exports = Feature;
