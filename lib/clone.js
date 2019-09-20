#!/usr/bin/env node

'use strict';

const request = require('request');
const EOT = require('../util/eot');

/**
 * @class Clone
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#downloading-via-clone|Hecate Documentation}
 */
class Clone {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch a complete dataset from the server');
        console.error();
        console.error('Usage: cli.js clone <subcommand>');
        console.error();
        console.error('<subcommand>:');
        console.error('    get      Stream LDgeoJSON of all the data on the server');
        console.error();
    }

    /**
     * Clone all data on a given hecate server
     *
     * @param {!Object} options Options for making a request to the hecate /api/data/features endpoint
     * @param {Stream} [options.output] Stream to write line-delimited GeoJSON to
     *
     * @param {function} cb (err, res) style callback function
     */
    get(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script || options.cli) {
            cb = cli;

            options.output = process.stdout;

            return main();
        } else {
            return main();
        }

        function main() {
            if (!options.output) return cb(new Error('options.output required'));

            request({
                method: 'GET',
                url: `http://${self.api.url}:${self.api.port}/api/data/clone`,
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

module.exports = Clone;
