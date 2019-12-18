'use strict';
const prompt = require('prompt');
const auth = require('../util/get_auth');
const revert = require('../util/revert');

/**
 * @class Revert
 * @public
 */
class Revert {
    /**
     * Create a new Revert Instance
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
        console.error('Revert data of an specified delta');
        console.error();
        console.error('Usage: cli.js revert <subcommand>');
        console.error();
        console.error('<subcommand>');
        console.error('    deltas       Revert a given set of deltas');
        console.error('                 [--start] Delta ID to revert from (inclusive)');
        console.error('                 [--end] Delta ID to revert to (inclusive)');
        console.error();
    }

    /**
     * Revert a given set of deltas
     *
     * @param {!Object} options Options for making reversion of a set of deltas
     * @param {number} options.start Inclusive start delta ID to revert
     * @param {number} options.end Inclusive end delta ID to revert
     * @param {Stream} [options.output] Stream to write line-delimited GeoJSON to
     *
     * @param {function} cb (err, res) style callback function
     *
     * @returns {function} (err, res) style callback
     */
    deltas(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;
            return main(options);
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [{
                name: 'start',
                message: 'inclusive delta ID to start reversion from',
                required: true,
                type: 'number',
                default: options.start
            }, {
                name: 'end',
                message: 'inclusive delta ID to end reversion at',
                required: false,
                type: 'number',
                default: options.end
            }];

            if (
                (
                    !self.api.user
                    && self.api.auth_rules
                ) && (
                    self.api.auth_rules.feature.get !== 'public'
                    || self.api.auth_rules.feature.history !== 'public'
                    || self.api.auth_rules.delta.get !== 'public'
                    || self.api.auth_rules.delta.list !== 'public'
                )
            ) {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                options.start = argv.start;
                options.end = argv.end;
                options.output = process.stdout;

                main(options);
            });
        } else {
            return main(options);
        }

        /**
         * Once the options object is populated, make the API request
         * @private
         *
         * @param {Object} options option object
         * @param {number} options.start Inclusive start delta ID to revert
         * @param {number} options.end Inclusive end delta ID to revert
         * @param {Stream} [options.output] Stream to write line-delimited GeoJSON to
         *
         * @returns {undefined}
         */
        async function main(options) {
            if (!options.start) return cb(new Error('start delta is required'));
            if (!options.end) return cb(new Error('start delta is required'));
            if (options.start > options.end) return cb(new Error('start delta must be less than end delta'));
            if (!options.output) return cb(new Error('output stream is required'));

            try {
                const db = await revert.cache(options, self.api);
                revert.iterate(db, options.output);

                revert.cleanCache(db);
            } catch (err) {
                return cb(err);
            }

            options.output.end();

            return cb();
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

            console.log('Reversion Generated');
        }
    }
}

module.exports = Revert;
