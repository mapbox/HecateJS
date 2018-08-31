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
     * 
     * @param {function} cb (err, res) style callback function
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

            if (self.api.auth_rules && self.api.auth_rules.feature.get !== 'public') {
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

                options.feature = argv.feature;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.feature) return cb(new Error('options.feature required'));

            request({
                json: true,
                method: 'GET',
                url: `http://${self.api.url}:${self.api.port}/api/data/feature/${options.feature}/history`,
                auth: self.api.user
            }, (err, res) => {
                if (res.statusCode !== 200) return cb(new Error('HTTP ERROR'));

                return cb(err, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }

    /**
     * Queries the feature store endpoint by key, returning a
     * GeoJSON Feature
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.feature] key of the feature to download from
     * 
     * @param {function} cb (err, res) style callback function
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

            if (self.api.auth_rules && self.api.auth_rules.feature.get !== 'public') {
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

                options.feature = argv.feature;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.feature) return cb(new Error('options.feature required'));

            request({
                json: true,
                method: 'GET',
                url: `http://${self.api.url}:${self.api.port}/api/data/feature?key=${encodeURIComponent(options.feature)}`,
                auth: self.api.user
            }, (err, res) => {
                if (res.statusCode !== 200) return cb(new Error('HTTP ERROR'));

                return cb(err, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }

    /**
     * Queries the feature store endpoint, returning a
     * GeoJSON Feature
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.feature] ID of the feature to download from
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
                name: 'feature',
                message: 'feature id to download',
                required: true,
                type: 'string',
                default: options.feature
            }];

            if (self.api.auth_rules && self.api.auth_rules.feature.get !== 'public') {
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

                options.feature = argv.feature;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.feature) return cb(new Error('options.feature required'));

            request({
                json: true,
                method: 'GET',
                url: `http://${self.api.url}:${self.api.port}/api/data/feature/${options.feature}`,
                auth: self.api.user
            }, (err, res) => {
                if (res.statusCode !== 200) return cb(new Error('HTTP ERROR'));

                return cb(err, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }
}

module.exports = Query;
