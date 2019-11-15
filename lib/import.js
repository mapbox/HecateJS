#!/usr/bin/env node

'use strict';

const MAX_UPLOAD = 1048576; // Maxish number of bytes to upload per delta (Server typically allows up to 20m

const str_size = require('node-mb-string-size'); // eslint-disable-line node/no-missing-require
const rewind = require('geojson-rewind');
const path = require('path');
const prompt = require('prompt');
const config = require('../package.json');
const validateGeojson = require('../util/validateGeojson.js');
const readLineSync = require('n-readlines');
const auth = require('../util/get_auth');
const request = require('requestretry');
const schema = require('../lib/schema.js');

class ArrayReader {
    constructor(array) {
        this.array = array;
        this.counter = 0;
    }

    next() {
        let line = false;
        if (this.counter < this.array.length) {
            line = JSON.stringify(this.array[this.counter]);
            this.counter++;
        } else {
            line = false;
        }
        return line;
    }
}

/**
 * @class Import
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#feature-creation|Hecate Documentation}
 */
class Import {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Upload Create/Modified/Deleted Data to the server');
        console.error();
        console.error('usage: cli.js import <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    multi        Import multiple features');
        console.error('                 [--ignore-rhr] Ignore Right Hand Rule Errors');
        console.error();
    }

    multi(options = {}, cb) {
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
                name: 'message',
                message: 'Description of changes in upload',
                required: true,
                type: 'string',
                default: options.message
            }, {
                name: 'input',
                message: 'File to upload',
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

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.input) return cb(new Error('options.input required'));
            if (!options.message) return cb(new Error('options.message required'));

            let rl;

            if (Array.isArray(options.input)) {
                rl = new ArrayReader(options.input);

            } else {
                const filepath = path.resolve(options.input);
                rl = new readLineSync(filepath);

                // validate the geojson file before uploading starts
                getSchema((err, schema) => {
                    if (err) return cb(err);

                    const geojsonErrs = validateGeojson(filepath, {
                        ignoreRHR: options.ignoreRHR,
                        schema: schema
                    });

                    if (geojsonErrs.length) return cb(new Error(`Invalid GeoJSON: \n${geojsonErrs}`));
                });
            }

            let total = 0; // Total uploaded line delimited features - output in case of fatal error so the user can resume

            read();

            function read() {
                let bytes = 0;
                const buffer = [];
                let line = true;

                while (line) {
                    line = rl.next();

                    if (!line) break;
                    line = String(line);
                    if (!line.trim()) continue;

                    bytes += str_size(line);
                    buffer.push(rewind(JSON.parse(line)));

                    if (bytes > MAX_UPLOAD) break;
                }

                if (buffer.length === 0) return done();

                upload({
                    type: 'FeatureCollection',
                    message: options.message,
                    features: buffer
                }, () => {
                    total += buffer.length;

                    read();
                });
            }

            function done() {
                return cb(null, true);
            }

            function getSchema(callback) {
                new schema(self.api).get({}, (err, res) => {
                    if (err) callback(err);
                    return callback(null, res);
                });
            }

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

        function cli(err) {
            if (err) throw err;

            console.log('ok - import complete');
        }
    }
}


module.exports = Import;
