#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const validateBbox = require('../util/validateBbox');
const auth = require('../util/get_auth');

class Query {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error('');
        console.error('Fetch raw data from the server using the bbox API');
        console.error('');
        console.error('usage: cli.js bbox');
        console.error('');
    }

    cli(options = {}) {
        const self = this;

        if (!options) options = {};

        if (options.script) return run(options);

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
        }];

        if (this.api.auth_rules && this.api.auth_rules.feature.get !== 'public') {
            args = args.concat(auth(this.api.user));
        }

        prompt.get(args, (err, argv) => {
            prompt.stop();

            if (argv.username) {
                this.api.user = {
                    username: argv.username,
                    password: argv.password
                };
            }

            return run(argv);
        });

        function run(argv) {
            self.main(argv, (err, res) => {
                if (err) throw err;

                console.log(res);
            });
        }
    }


    /**
     * Queries hecate /api/data/features endpoint
     * Currently supports downloading features by bbox
     *
     * @param {!Object} options Options for making a request to the hecate /api/data/features endpoint
     * @param {Array|string} [options.bbox] Bounding box of features to download from hecate
     */
    // TODO: handle queries to the features endpoint other than bbox
    main(options = {}, cb) {
        if (!options) options = {};

        if (!options.bbox) return cb(new Error('options.bbox required'));

        // Validate options.bbox. Will throw an error it bbox is invalid
        if (options.bbox) validateBbox(options.bbox);

        // TODO this should return a stream or else we will quickly run out of memory
        request({
            method: 'GET',
            url: `http://${this.api.url}:${this.api.port}/api/data/features?bbox=${options.bbox}`,
            auth: this.api.user
        }, (err, res) => {
            if (err) return cb(err);
            if (res.statusCode !== 200) {
                const error = new Error(res.body);
                error.status = res.statusCode;
                return cb(error);
            }
            return cb(null, res.body);
        });
    }
}

module.exports = Query;
