#!/usr/bin/env node

'use strict';

const MAX_UPLOAD = 1048576; // Maxish number of bytes to upload per delta (Server typically allows up to 20m

const str_size = require('node-mb-string-size');
const request = require('request');
const path = require('path');
const prompt = require('prompt');
const config = require('../package.json');
const validateGeojson = require('../util/validateGeojson.js');
const readLineSync = require('n-readlines');
const auth = require('../util/get_auth');

class Import {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error('');
        console.error('Upload Create/Modified/Deleted Data to the server');
        console.error('');
        console.error('usage: cli.js import');
        console.error('');
    }

    cli(options) {
        prompt.message = '$';
        prompt.start();

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

        if (this.api.auth_rules && this.api.auth_rules.feature.create !== 'public') {
            args = args.concat(auth(options));
        }

        prompt.get(args, (err, argv) => {
            prompt.stop();

            this.main(argv, (err, res) => {
                if (err) throw err;
                console.error('ok - Upload Complete');
            });
        });
    }

    main(options, cb) {
        if (!options.input) return cb(new Error('options.input required'));
        if (!options.message) return cb(new Error('options.message required'));

        let auth;
        if (options.username || options.password) {
            auth = {
                username: options.username,
                password: options.password
            }
        }

        const self = this;

        let total = 0; // Total uploaded line delimited features - output in case of fatal error so the user can resume
        const filepath = path.resolve(__dirname, '..', options.input);
        const rl = new readLineSync(filepath);

        // validate the geojson file before uploading starts
        const geojsonErrs = validateGeojson(filepath);
        if (geojsonErrs.length) return cb(new Error(`Invalid GeoJSON: \n${geojsonErrs}`));

        read();

        function read() {
            let bytes = 0;
            const buffer = [];
            let line = true;

            while (line) {
                line = rl.next();
                if (!line) break;
                bytes += str_size(line);
                buffer.push(JSON.parse(line));

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

        function upload(body, upload_cb) {
            console.error(`ok - beginning upload of ${body.features.length} features`);

            body.features = body.features.map((feat) => {
                //Ensure previously downloaded data can't be accidently uploaded
                //but do allow generic GeoJSON to be uploaded automatically
                if (!feat.id && !feat.version && !feat.action) feat.action = 'create';
                return feat;
            });

            request({
                method: 'POST',
                url: `http://${self.api.url}:${self.api.port}/api/data/features`,
                headers: {
                    'User-Agent': `Hecate-Internal v${config.version}`,
                    'Content-Type': 'application/json'
                },
                auth: auth,
                body: JSON.stringify(body)
            }, (err, res) => {
                if (err) {
                    console.error(`Upload Error: Uploaded to Line ${total}`);
                    return cb(err);
                }

                if (res.statusCode !== 200) {
                    console.error(`Upload Error: Uploaded to Line ${total}`);
                    return cb(new Error(res.body));
                }

                return upload_cb();
            });
        }
    };
}


module.exports = Import;
