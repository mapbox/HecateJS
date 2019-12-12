'use strict';
const prompt = require('prompt');
const auth = require('../util/get_auth');
const revert = require('../util/revert');

/**
 * @class Revert
 * @public
 */
class Revert {
    constructor(api) {
        this.api = api;
    }

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
     * @param {!Object} options options for making reversion of a set of deltas
     * @param {Number} options.start Incusive start delta ID to revert
     * @param {Number} options.end inclusive end delta ID to revert
     * @param {Stream} [options.output] Stream to write line-delimited GeoJSON to
     *
     * @param {function} cb (err, res) style callback function
     */
    deltas(options = {}, cb) {
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
                name: 'start',
                message: 'delta id to start reversion from',
                required: true,
                type: 'number',
                default: options.start
            }, {
                name: 'end',
                message: 'delta id to end reversion ad',
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

                main();
            });
        } else {
            return main();
        }

        async function main() {
            if (!options.start) return cb(new Error('start delta is required'));
            if (!options.end) return cb(new Error('start delta is required'));
            if (options.start > options.end) return cb(new Error('start delta must be less than end delta'));
            if (!options.output) return cb(new Error('output stream is required'));

            try {
                const db = await revert.cache(options, self.api);

                revert.iterate(db, options.output);
            } catch(err) {
                return cb(err);
            }

            options.output.end();

            return cb();
        }

        function cli(err) {
            if (err) throw err;

            console.log('Reversion Generated');
        }
    }
}

module.exports = Revert;
