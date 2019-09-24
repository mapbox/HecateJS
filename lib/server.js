#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

/**
 * @class Server
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#meta|Hecate Documentation}
 */
class Server {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch a metadata about the server');
        console.error();
        console.error('Usage: cli.js server <subcommand>');
        console.error();
        console.error('<subcommand>:');
        console.error('    get      Get server meta');
        console.error('    stats    Get geo stats from server');
        console.error();
    }

    /**
     * Get server metadata
     *
     * @param {!Object} options Options for making a request to meta API
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

            let args = [];

            if (self.api.auth_rules && self.api.auth_rules.server !== 'public') {
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
            request({
                json: true,
                method: 'GET',
                url: `https://${self.api.url}:${self.api.port}/api`,
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }

    /**
     * Get server stats
     *
     * @param {!Object} options Options for making a request to meta API
     *
     * @param {function} cb (err, res) style callback function
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

            let args = [];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.stats.get !== 'public') {
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
            request({
                json: true,
                method: 'GET',
                url: `https://${self.api.url}:${self.api.port}/api/data/stats`,
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }
}

module.exports = Server;
