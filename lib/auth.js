#! /usr/bin/env node

'use strict';

const request = require('request');

/**
 * @class Auth
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#authentication|Hecate Documentation}
 */
class Auth {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('Fetch authentication settings that the server uses to allow or deny specific api endpoints');
        console.error();
        console.error('Usage: cli.js auth <subcommand>');
        console.error();
        console.error('<subcommand>:');
        console.error('    get      Download the authentication settings');
        console.error();
    }

    /**
     * Return the auth settings for a given hecate instance
     *
     * @param {!Object} options Options for making a request to the auth API
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
            return main();
        } else {
            return main();
        }

        function main() {
            request.get({
                json: true,
                url: `http://${self.api.url}:${self.api.port}/api/auth`,
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);

                if (res.statusCode === 404) return cb(new Error('404: Could not obtain auth list'));
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

module.exports = Auth;
