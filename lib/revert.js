'use strict';
const prompt = require('prompt');
const auth = require('../util/get_auth');
const Q = require('d3-queue').queue;

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

                main();
            });
        }

        function main() {
            if (!options.start) return cb(new Error('start delta is required'));
            if (!options.end) return cb(new Error('start delta is required'));

            const deltaQ = new Q(10);

            for (let i = options.start; i <= options.end; i++) {
                deltaQ.defer((delta, done) => {
                    console.error(delta);
                    return done();
                }, i);
            }

            deltaQ.awaitAll((err, res) => {
                if (err) return cb(err);
            });
        }

        function cli(err, res) {
            if (err) throw err;

            console.log('Reversion Generated');
        }
    }
}

module.exports = Revert;
