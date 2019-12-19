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
    /**
     * Create a new Auth Instance
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
     * @param {function} cb (err, res) style callback function
     */
    get(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;
            main();
        } else if (options.cli) {
            cb = cli;
            main();
        } else {
            main();
        }

        /**
         * Once the options object is populated, make the API request
         * @private
         */
        function main() {
            request.get({
                json: true,
                url: new URL('/api/auth', self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);

                if (res.statusCode === 404) return cb(new Error('404: Could not obtain auth list'));
                if (res.statusCode === 401) return cb(new Error('401: Unauthorized'));
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                cb(null, res.body);
            });
        }

        /**
         * If in CLI mode, write results to stdout
         * or throw any errors incurred
         *
         * @private
         *
         * @param {Error} err [optional] API Error
         * @param {Object} auth Hecate Auth JSON
         */
        function cli(err, auth) {
            if (err) throw err;

            console.log(JSON.stringify(auth, null, 4));
        }
    }
}

module.exports = Auth;
