#!/usr/bin/env node

'use strict';

// Maxish number of bytes to upload per delta (Default allows up to 20m)
const DEFAULT_UPLOAD = 1048576;

const os = require('os');
const fs = require('fs');
const path = require('path');
const split = require('split');
const pipeline = require('stream').pipeline;
const rewind = require('geojson-rewind');
const prompt = require('prompt');
const config = require('../package.json');
const validateGeojson = require('../util/validateGeojson.js');
const auth = require('../util/get_auth');
const request = require('requestretry');
const readLineSync = require('n-readlines');

/**
 * @class Import
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#feature-creation|Hecate Documentation}
 */
class Import {
    /**
     * Create a new Import Instance
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
        console.error('Upload Create/Modified/Deleted Data to the server');
        console.error();
        console.error('usage: cli.js import <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    multi        Import multiple features');
        console.error('                 [--ignore-rhr] Ignore Right Hand Rule Errors');
        console.error('                 [--ignore-dup] Disable duplicate ID check');
        console.error('                 [--dryrun] Perform pre-import validation checks');
        console.error('                     but do not perform import');
        console.error();
    }

    /**
     * Given a Stream of line-delimited features or an Array of features, validate and
     * import them
     *
     * @param {Object} options options object
     * @param {string} options.message Human readable description of changes
     * @param {Stream|string} options.input Stream of line-delimited geojson features to import or string of the file path to import
     * @param {boolean} options.ignoreRHR Ignore RHR winding errors
     * @param {boolean} options.ignoreDup Don't check duplicate IDs (will usually cause an import failure if they exist)
     * @param {boolean} options.dryrun Perform all validation but don't import
     * @param {function} cb (err, res) style callback
     *
     * @returns {function} (err, res) style callback
     */
    multi(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            if (options.input) {
                options.input = fs.createReadStream(path.resolve(options.input));
            } else {
                options.input = process.stdin;
            }

            cb = cli;
            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [{
                name: 'message',
                message: 'Description of changes in upload',
                required: true,
                type: 'string',
                default: options.message
            }, {
                name: 'input',
                message: 'File to upload (empty for stdin)',
                required: true,
                type: 'string',
                default: options.input
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.feature.create !== 'public') {
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

                options.input = argv.input;
                options.message = argv.message;
                options.ignoreRHR = !!options['ignore-rhr'];
                options.ignoreDup = !!options['ignore-dup'];
                options.dryrun = !!options.dryrun;

                if (argv.input) {
                    options.input = fs.createReadStream(path.resolve(argv.input));
                } else {
                    options.input = process.stdin;
                }

                return main();
            });
        } else {
            if (typeof options.input === 'string') {
                options.input = fs.createReadStream(path.resolve(options.input));
            }

            return main();
        }

        /**
         * Once the options object is populated, make the API request
         * @private
         *
         * @returns {undefined}
         */
        function main() {
            if (!options.input) return cb(new Error('options.input required'));
            if (!options.message) return cb(new Error('options.message required'));

            let total = 0; // Total uploaded line delimited features - output in case of fatal error so the user can resume
            let rl;

            // This call is optional and won't terminate the upload if it fails,
            // It simply attempts to determine the max upload size constraints of the server
            self.api._.server.get({}, (err, server) => {
                if (err || !server || !server.constraints || !server.constraints.request || !server.constraints.request.max_size) {
                    options.max = DEFAULT_UPLOAD;
                } else {
                    options.max = server.constraints.request.max_size / 2;
                }

                // validate the geojson file before uploading starts
                self.api._.schema.get({}, (err, schema) => {
                    if (err) return cb(err);

                    if (schema) {
                        console.error('ok - using fetched JSON Schema');
                    } else {
                        console.error('warn - no JSON Schema fetched');
                    }

                    const tmp = path.resolve(os.tmpdir(), `import.${Math.random().toString(36).substring(7)}.geojson`);

                    pipeline(
                        options.input,
                        split(),
                        validateGeojson({
                            ignoreRHR: options.ignoreRHR,
                            schema: schema,
                            ids: !options.ignoreDup
                        }),
                        // Since the library accepts a stream and does two complete passes over it,
                        // one for validaton, and the second for import, the file is saved as a tmp
                        // file in order to perform the second pass (import)
                        fs.createWriteStream(tmp),
                        (err) => {
                            if (err) return cb(err);

                            rl = new readLineSync(tmp);

                            read();
                        }
                    );
                });
            });

            /**
             * Read features from the stream, chunking into an acceptable
             * import size, and passing to the import function
             *
             * @private
             *
             * @returns {undefined}
             */
            function read() {
                if (options.dryrun) {
                    console.error('ok - ok skipping import (dryrun)');
                    return cb(null, true);
                }

                let bytes = 0;
                const buffer = [];
                let line = true;

                while (line) {
                    line = rl.next();

                    if (!line) break;
                    line = String(line);
                    if (!line.trim()) continue;

                    bytes += Buffer.from(line).length;
                    buffer.push(rewind(JSON.parse(line)));

                    if (bytes > options.max) break;
                }

                if (buffer.length === 0) return cb(null, true);

                upload({
                    type: 'FeatureCollection',
                    message: options.message,
                    features: buffer
                }, () => {
                    total += buffer.length;

                    read();
                });
            }

            /**
             * Once validated, perform an import of the given features
             *
             * @private
             *
             * @param {Object} body GeoJSON Feature collection to upload
             * @param {function} upload_cb (err, res) style callback
             */
            function upload(body, upload_cb) {
                console.error(`ok - beginning upload of ${body.features.length} features`);

                body.features = body.features.map((feat) => {
                    // Ensure previously downloaded data can't be accidently uploaded
                    // but do allow generic GeoJSON to be uploaded automatically
                    if (!feat.id && !feat.version && !feat.action) feat.action = 'create';
                    return feat;
                });

                request({
                    method: 'POST',
                    url: new URL('/api/data/features', self.api.url),
                    headers: {
                        'User-Agent': `Hecate-Internal v${config.version}`,
                        'Content-Type': 'application/json'
                    },
                    auth: self.api.user,
                    body: JSON.stringify(body)
                }, (err, res) => {
                    if (err) {
                        console.error(`Upload Error: Uploaded to Line ${total}`);
                        return cb(err);
                    }

                    if (res.statusCode !== 200) {
                        console.error(`${res.body}`);
                        console.error(`Upload Error: Uploaded to Line ${total}`);
                        return cb(new Error(JSON.stringify(res.body)));
                    }
                    return upload_cb();
                });
            }
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

            console.log('ok - import complete');
        }
    }
}


module.exports = Import;
