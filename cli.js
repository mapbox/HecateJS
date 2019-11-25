#!/usr/bin/env node

'use strict';

const prompt = require('prompt');
const auth = require('./util/get_auth');
const settings = require('./package.json');

/**
 * @class Hecate
 */
class Hecate {
    constructor(api = {}) {
        this.url = api.url ? new URL(api.url).toString() : 'http://localhost:8000';
        this.user = false;

        if ((api.username || process.env.HECATE_USERNAME) && (api.password || process.env.HECATE_PASSWORD)) {
            this.user = {
                username: api.username ? api.username : process.env.HECATE_USERNAME,
                password: api.password ? api.password : process.env.HECATE_PASSWORD
            };
        }

        this.auth_rules = api.auth_rules ? api.auth_rules : null;

        // Instantiate New Library Instances
        this._ = {
            auth: new (require('./lib/auth'))(this),
            bbox: new (require('./lib/bbox'))(this),
            bboxHistory: new (require('./lib/bbox-history'))(this),
            webhooks: new (require('./lib/webhooks'))(this),
            tiles: new (require('./lib/tiles'))(this),
            clone: new (require('./lib/clone'))(this),
            bounds: new (require('./lib/bounds'))(this),
            feature: new (require('./lib/feature'))(this),
            deltas: new (require('./lib/deltas'))(this),
            user: new (require('./lib/user'))(this),
            schema: new (require('./lib/schema'))(this),
            server: new (require('./lib/server'))(this),
            import: new (require('./lib/import'))(this),
            revert: new (require('./lib/revert'))(this)
        };

        // Add Helper Functions
        this.auth = (...opts) => this._.auth.get(...opts);
        this.clone = (...opts) => this._.clone.get(...opts);
        this.server = (...opts) => this._.server.get(...opts);
        this.bbox = (...opts) => this._.bbox.get(...opts);
        this.bboxHistory = (...opts) => this._.bboxHistory.get(...opts);
        this.listDeltas = (...opts) => this._.deltas.list(...opts);
        this.getDelta = (...opts) => this._.deltas.get(...opts);
        this.listBounds = (...opts) => this._.bounds.list(...opts);
        this.setBound = (...opts) => this._.bounds.set(...opts);
        this.getBound = (...opts) => this._.bounds.get(...opts);
        this.getBoundMeta = (...opts) => this._.bounds.meta(...opts);
        this.register = (...opts) => this._.user.register(...opts);
        this.schema = (...opts) => this._.schema.get(...opts);
        this.import = (...opts) => this._.import.multi(...opts);
        this.revert = (...opts) => this._.revert.revert(...opts);
        this.getFeatureHistory = (...opts) => this._.feature.history(...opts);
        this.getFeatureKey = (...opts) => this._.feature.key(...opts);
        this.getFeature = (...opts) => this._.feature.get(...opts);
    }
}

module.exports = Hecate;

// Run in CLI mode
if (require.main === module) {
    const argv = require('minimist')(process.argv, {
        boolean: ['help', 'version'],
        alias: {
            version: 'v',
            help: '?'
        }
    });

    if (argv.version) {
        console.error('hecate-cli@' + settings.version);
        process.exit(0);
    } else if (!argv._[2] || (!argv._[2] && argv.help) || argv._[2] === 'help') {
        console.error('');
        console.error('usage: cli.js <command> [--version] [--help]');
        console.error('');
        console.error('note: the --script flag can be applied to any mode to disable prompts');
        console.error('      when used the user is responsible for making sure they have all the');
        console.error('      correct flags');
        console.error('');
        console.error('<command>');
        console.error('    help                 Displays this message');
        console.error('    user     [--help]    User Management');
        console.error('    import   [--help]    Import data into the server');
        console.error('    feature  [--help]    Download individual features & their history');
        console.error('    schema   [--help]    Obtain the JSON schema for a given server');
        console.error('    auth     [--help]    Obtain the JSON Auth document');
        console.error('    bbox     [--help]    Download data via bbox from a given server');
        console.error('    clone    [--help]    Download the complete server dataset');
        console.error('    revert   [--help]    Revert data from an specified delta');
        console.error('');
        console.error('<options>');
        console.error('    --version            Print the current version of the CLI');
        console.error('    --help               Print a help message');
        console.error();
        process.exit(0);
    }

    const command = (err, hecate) => {
        if (err) throw err;
        const command = argv._[2];
        const subcommand = argv._[3];

        if (command && !hecate._[command]) {
            console.error();
            console.error(`"${command}" command not found!`);
            console.error();
            process.exit(1);
        } else if (command && subcommand && !hecate._[command][subcommand]) {
            console.error();
            console.error(`"${command} ${subcommand}" command not found!`);
            console.error();
            process.exit(1);
        } else if (argv.help || !subcommand) {
            return hecate._[command].help();
        }

        if (!argv.script) {
            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            prompt.get([{
                name: 'url',
                message: 'URL to connect to local or remote Hecate instance. Be sure to include the protocol and port number for local instances, e.g. \'http://localhost:8000\'',
                type: 'string',
                required: 'true',
                default: hecate.url
            }], (err, res) => {
                if (err) throw err;
                hecate.url = new URL(res.url).toString();
                argv.cli = true;

                // if a custom auth policy hasn't been passed
                if (!hecate.auth_rules) {
                    // fetch auth
                    hecate.auth({}, (err, auth_rules) => {
                        // if requesting auth returns a 401
                        if (err && err.message === '401: Unauthorized') {
                            // if username and password isn't set, prompt for it
                            if (!hecate.user) {
                                prompt.get(auth(hecate.user), (err, res) => {
                                    if (err) throw err;
                                    hecate.user = {
                                        username: res.hecate_username,
                                        password: res.hecate_password
                                    };
                                    // request auth again
                                    hecate.auth({}, (err, auth_rules) => {
                                        if (err) throw err;
                                        hecate.auth_rules = auth_rules;
                                        return run();
                                    });
                                });
                            } else {
                                return run();
                            }
                        } else {
                            hecate.auth_rules = auth_rules;
                            return run();
                        }
                    });
                } else return run();
            });
        } else {
            return run();
        }

        function run() {
            if (!subcommand) {
                hecate[command](argv);
            } else {
                hecate._[command][subcommand](argv);
            }
        }
    };

    command(null, new Hecate(argv));
}
