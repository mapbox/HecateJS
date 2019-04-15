#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

/**
 * @class Tiles
 */
class Tiles {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch a Mapbox Vector Tile for the given zxy');
        console.error();
        console.error('usage: cli.js tiles <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    get      Get a specific mvt');
    }

    /**
     * Fetch a Mapbox Vector Tile for the given zxy
     *
     * @param {!Object} options Options for making a request to the deltas endpoint
     * @param {String} [options.zxy] z/x/y coordinate to request
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
                name: 'z/x/y',
                message: 'Z/X/Y of tile to retrieve',
                required: true,
                type: 'string',
                default: options.zxy
            }];

            if (self.api.auth_rules && self.api.auth_rules.mvt.get !== 'public') {
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
            if (!options.zxy) return cb(new Error('options.zxy required'));

            request({
                json: true,
                method: 'GET',
                url: `http://${self.api.url}:${self.api.port}/api/tiles/${options.zxy}`,
                auth: self.api.user
            }, (err, res) => {
                if (res.statusCode !== 200) return cb(new Error(res.body));

                return cb(err, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.error('not ok - cannot output to console');
        }
    }
}

module.exports = Tiles;
