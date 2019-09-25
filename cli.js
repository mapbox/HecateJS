#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('./util/get_auth');
const settings = require('./package.json');

/**
 * @class Hecate
 */
class Hecate {
    constructor(api = {}) {
        this.url = api.url ? api.url : 'localhost';
        this.port = api.port ? api.port : '8000';
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
    }

    static stack(stack, auth, cb) {
        const url = `https://hecate-internal-${stack}.tilestream.net`;
        request(url, (err, res) => {
            if (err) throw new Error('Failed to connect');

            if (res.statusCode !== 200) throw new Error('Connected but recieved status code: ' + res.statusCode);

            if (!auth) auth = {};

            return cb(null, new Hecate({
                url: url,
                port: 80,
                username: auth.username,
                password: auth.password
            }));
        });
    }
}

module.exports = Hecate;

// Run in CLI mode
if (require.main === module) {
    const argv = require('minimist')(process.argv, {
        boolean: ['help', 'version'],
        string: ['stack'],
        alias: {
            version: 'v',
            help: '?'
        }
    });

    if (!argv._[2] && argv.stack) {
        Hecate.stack(argv.stack, {}, (err, res) => {
            if (err) throw err;

            console.log(res.url);
        });
    }

    if (argv.version) {
        console.error('hecate-cli@' + settings.version);
        process.exit(0);
    } else if (!argv._[2] || (!argv._[2] && argv.help) || argv._[2] === 'help') {
        console.error('');
        console.error('usage: cli.js <command> [--version] [--help] [--stack <STACK NAME>]');
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
        console.error('    --stack <STACK>      By default the cli assumes you are connecting');
        console.error('                         via SSH port forwarding on localhost');
        console.error('                         Specify the hecate-internal stack name and it will');
        console.error('                         connect via the exported ELB');
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
                message: 'URL to hecate instance',
                type: 'string',
                required: 'true',
                default: hecate.url
            }, {
                name: 'port',
                message: '8000 for local, 8888 for connect.sh, 80 for --stack ELB',
                type: 'string'
            }], (err, res) => {
                if (err) throw err;
                hecate.url = res.url;
                hecate.port = res.port;
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

    if (argv.stack) {
        Hecate.stack(argv.stack, {}, command);
    } else {
        command(null, new Hecate(argv));
    }

}
