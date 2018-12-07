#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

class Styles {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch a list of styles');
        console.error();
        console.error('Usage: cli.js styles <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    list      List styles the public (or an authed user) has access to');
        console.error();
    }

    /**
     * Return A list of styles that the public (or an authed user) has access to
     *
     * @param {!Object} options options for making a query to the styles list endpoint
     *
     * @param {function} cb (err, res) style callback function
     */
    list(options = {}, cb) {
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

            if (self.api.auth_rules && self.api.auth_rules.style.list !== 'public') {
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

                return main();
            });
        } else {
            return main();
        }

        function main() {
            request({
                method: 'GET',
                json: true,
                url: `http://${self.api.url}:${self.api.port}/api/data/styles`,
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(res.body));

                return cb(null, res.body);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log(JSON.stringify(res, null, 4));
        }
    }
}

module.exports = Styles;
