#! /usr/bin/env node

'use strict';

const request = require('request');

class Auth {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch authentication settings that the server uses to allow or deny specific api endpoints');
        console.error();
        console.error('Usage: cli.js auth <subcommand>');
        console.error()
        console.error('<subcommand>:');
        console.error('    get      Download the authentication settings');
        console.error();
    }

    get(options = {}, cb) {
        if (!options) options = {};

        if (cli) cb = cli;

        request.get({
            json: true,
            url: `http://${this.api.url}:${this.api.port}/api/auth`,
            auth: this.api.user
        }, (err, res) => {
            if (err) return cb(err);

            if (res.statusCode === 404) return cb(new Error('404: Could not obtain auth list'));
            if (res.statusCode !== 200) return cb(new Error(res.body));

            return cb(null, res.body);
        });

        function cli(err, res) {
            if (err) throw err; 

            console.log(JSON.stringify(res, null, 4));
        }
    }
}

module.exports = Auth;
