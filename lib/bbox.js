#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const validateBbox = require('../util/validateBbox');
const auth = require('../util/get_auth');
const EOT = require('../util/eot');

/**
 * @class BBox
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#downloading-multiple-features-via-bbox|Hecate Documentation}
 */
class BBox {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch raw data from the server using the bbox API');
        console.error();
        console.error('Usage: cli.js bbox <subcommand>');
        console.error();
        console.error('<subcommand>:');
        console.error('    get      Stream LDgeoJSON within the given BBOX');
        console.error();
    }

    /**
     * Queries hecate /api/data/features endpoint
     * Currently supports downloading features by bbox
     *
     * @param {!Object} options Options for making a request to the hecate /api/data/features endpoint
     * @param {boolean} [options.history] [default: false] If true, return current and historic features
     *                                  within the given bbox.
     * @param {Array|string} [options.bbox] Bounding box of features to download from hecate
     * @param {Stream} [options.output] Stream to write line-delimited GeoJSON to
     *
     * @param {function} cb (err, res) style callback function
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
                name: 'bbox',
                message: 'bbox to download',
                required: true,
                type: 'string',
                default: options.bbox
            },{
                name: 'history',
                message: 'download current & historic data',
                required: true,
                type: 'boolean',
                default: options.history
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.feature.get !== 'public') {
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

                options.bbox = argv.bbox;
                options.output = process.stdout;
                options.history = argv.history;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.bbox) return cb(new Error('options.bbox required'));
            if (!options.output) return cb(new Error('options.output required'));

            // Validate options.bbox. Will throw an error it bbox is invalid
            if (options.bbox) validateBbox(options.bbox);

            let url;

            if (options.historic) {
                url = new URL(`/api/data/features/history?bbox=${options.bbox}`, self.api.url);
            } else {
                url = new URL(`/api/data/features?bbox=${options.bbox}`, self.api.url);
            }

            request({
                method: 'GET',
                url: new URL(`/api/data/features?bbox=${options.bbox}`, self.api.url),
                auth: self.api.user
            }).on('error', (err) => {
                return cb(err);
            }).on('response', (res) => {
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));
            }).pipe(new EOT(cb)).pipe(options.output);
        }

        function cli(err) {
            if (err) throw err;
        }
    }
}

module.exports = BBox;
