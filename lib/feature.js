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
        console.error('');
        console.error('Fetch an individual feature and it\'s corresponding metadata');
        console.error('');
        console.error('usage: cli.js feature');
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
            name: 'feature',
            message: 'feature id to download',
            required: true,
            type: 'string',
            default: options.feature
        }];

        if (this.api.auth_rules && this.api.auth_rules.feature.get !== 'public') {
            args = args.concat(auth(this.api.user));
        }

        prompt.get(args, (err, argv) => {
            if (err) throw err;

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

                console.log(JSON.stringify(res, null, 4));
            });
        }
    }

    /**
     * Queries the feature store endpoint, returning a
     * GeoJSON Feature
     *
     * @param {!Object} options Options for making a request to the bounds endpoint
     * @param {String} [options.feature] ID of the feature to download from
     */
    main(options = {}, cb) {
        if (!options) options = {};

        if (!options.feature) return cb(new Error('options.feature required'));

        request({
            json: true,
            method: 'GET',
            url: `http://${this.api.url}:${this.api.port}/api/data/feature/${options.feature}`,
            auth: this.api.user
        }, (err, res) => {
            if (res.statusCode !== 200) return cb(new Error('HTTP ERROR'));

            return cb(err, res.body);
        });
    }
}

module.exports = Query;
