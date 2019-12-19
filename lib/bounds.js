#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');
const EOT = require('../util/eot');

/**
 * @class Bounds
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#boundaries|Hecate Documentation}
 */
class Bounds {
    /**
     * Create a new Bounds Instance
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
        console.error('Fetch raw data from the server using the bounds API');
        console.error();
        console.error('Usage: cli.js bounds <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    get      Download geometries within a given bounds');
        console.error('    stats    Get stats for a given bounds');
        console.error('    meta     Get underlying boundary geojson');
        console.error('    delete   Delete a given bound');
        console.error('    set      Create a new bound');
        console.error('    list     List all potential bounds names');
        console.error();
    }

    /**
     * Return stats of geo data within a give bounds
     *
     * @param {!Object} options options for making a query to the bounds list endpoint
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
     */
    stats(options = {}, cb) {
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
                message: 'bound to download',
                required: true,
                type: 'string',
                default: options.bound
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.stats.get !== 'public') {
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

                options.bound = argv.bound;

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
            if (!options.bound) return cb(new Error('options.bound required'));

            request({
                method: 'GET',
                json: true,
                url: new URL(`/api/data/bounds/${options.bound}/stats`, self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
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
         * @param {Object} stats stats object
         *
         * @returns {undefined}
         */
        function cli(err, stats) {
            if (err) throw err;

            console.log(JSON.stringify(stats, null, 4));
        }
    }

    /**
     * Return a list of the bounds that are currently loaded on the server
     *
     * @param {!Object} options options for making a query to the bounds list endpoint
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
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

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.bounds.list !== 'public') {
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
            request({
                method: 'GET',
                json: true,
                url: new URL('/api/data/bounds', self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
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
         * @param {Object} bounds list of bounds
         *
         * @returns {undefined}
         */
        function cli(err, bounds) {
            if (err) throw err;

            console.log(JSON.stringify(bounds, null, 4));
        }
    }

    /**
     * Queries the /api/data/bounds endpoints, returning a
     * line-delimited stream of GeoJSON Features
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.bound] Name of the bound to download from
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
                name: 'bound',
                message: 'bound to download',
                required: true,
                type: 'string',
                default: options.bound
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.bounds.get !== 'public') {
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

                options.output = process.stdout;
                options.bound = argv.bound;

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
            if (!options.bound) return cb(new Error('options.bound required'));
            if (!options.output) return cb(new Error('options.output required'));

            request({
                method: 'GET',
                url: new URL(`/api/data/bounds/${options.bound}`, self.api.url),
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

    /**
     * Returns underlying bounds geojson for a given bounds
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.bound] Name of the bound to download from
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
     */
    meta(options = {}, cb) {
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
                name: 'bound',
                message: 'bound to download',
                required: true,
                type: 'string',
                default: options.bound
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.bounds.get !== 'public') {
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

                options.bound = argv.bound;

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
            if (!options.bound) return cb(new Error('options.bound required'));

            request({
                method: 'GET',
                url: new URL(`/api/data/bounds/${options.bound}/meta`, self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
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
         * @param {Object} meta meta data about a given bound
         *
         * @returns {undefined}
         */
        function cli(err, meta) {
            if (err) throw err;

            console.log(JSON.stringify(meta, null, 4));
        }
    }

    /**
     * Delete a boundary file
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.bound] Name of the bound to download from
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
     */
    delete(options = {}, cb) {
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
                message: 'bound to delete',
                required: true,
                type: 'string',
                default: options.bound
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.bounds.delete !== 'public') {
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

                options.bound = argv.bound;

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
            if (!options.bound) return cb(new Error('options.bound required'));

            request({
                method: 'DELETE',
                url: new URL(`/api/data/bounds/${options.bound}`, self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, true);
            });
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

            console.error('ok - deleted bound');
        }
    }

    /**
     * Create or update a boundary file
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.bound] Name of the bound to download from
     * @param {String} [options.geom] JSON Geometry of bound
     * @param {function} cb (err, res) style callback function
     *
     * @return {function} (err, res) style callback
     */
    set(options = {}, cb) {
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
                message: 'name of bound to create',
                required: true,
                type: 'string',
                default: options.bound
            },{
                name: 'geometry',
                message: 'GeoJSON geometry of bound to create',
                required: true,
                type: 'string',
                default: options.geometry
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.bounds.create !== 'public') {
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

                options.bound = argv.bound;
                options.geometry = argv.geometry;

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
            if (!options.bound) return cb(new Error('options.bound required'));
            if (!options.geometry) return cb(new Error('options.geometry required'));

            request({
                method: 'POST',
                json: true,
                url: new URL(`/api/data/bounds/${options.bound}`, self.api.url),
                body: {
                    type: 'Feature',
                    properties: { },
                    geometry: options.geometry
                },
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, true);
            });
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

            console.error('ok - set bound');
        }
    }
}

module.exports = Bounds;
