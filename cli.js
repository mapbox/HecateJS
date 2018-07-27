#!/usr/bin/env node

'use strict';

const AWS = require('aws-sdk');
const cf = new AWS.CloudFormation({ region: 'us-east-1' });
const settings = require('./package.json');
const request = require('request');
const prompt = require('prompt');

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
            bounds: new (require('./lib/bounds'))(this),
            register: new (require('./lib/register'))(this),
            schema: new (require('./lib/schema'))(this),
            import: new (require('./lib/import'))(this),
            revert: new (require('./lib/revert'))(this)
        };

        this.auth = (...opts) => this._.auth.main(...opts);
        this.bbox = (...opts) => this._.bbox.main(...opts);
        this.listBounds = (...opts) => this._.list.main(...opts);
        this.getBound = (...opts) => this._.main.main(...opts);
        this.register = (...opts) => this._.register.main(...opts);
        this.schema = (...opts) => this._.schema.main(...opts);
        this.import = (...opts) => this._.import.main(...opts);
        this.revert = (...opts) => this._.revert.main(...opts);
    }

    static stack(stack, cb) {
        cf.describeStacks({
            StackName: `hecate-internal-${stack}`
        }, (err, res) => {
            if (err) return cb(err, res);

            // TODO: iterate through stacks and see if there is an exact match and not just multi-prefix match
            if (res.Stacks.length > 1) throw new Error('Found more than 1 stack with that name');

            let elb = res.Stacks[0].Outputs;

            elb = elb.filter((output) => { return output.OutputKey === 'HecateELB'; });

            if (!elb.length || elb.length > 1) throw new Error('Could not find a single matching ELB Endpoint');
            elb = elb[0].OutputValue;

            request(`http://${elb}`, (err, res) => {
                if (err) throw new Error('Failed to connect to ELB, are you in the same VPC?');

                if (res.statusCode !== 200) throw new Error('Connected but recieved status code: ' + res.statusCode);

                return cb(null, new Hecate({
                    url: elb,
                    port: 80
                }));
            });
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
        return Hecate.stack(argv.stack, (err, res) => {
            if (err) throw err;

            console.log(res.url);
        });
    }

    if (!argv._[2] || (!argv._[2] && argv.help)) {
        console.error('');
        console.error('usage: cli.js <command> [--version] [--help] [--stack <STACK NAME>]');
        console.error('');
        console.error('note: the --script flag can be applied to any mode to disable prompts');
        console.error('      when used the user is responsible for making sure they have all the');
        console.error('      correct flags');
        console.error('');
        console.error('<command>');
        console.error('    help                 Displays this message');
        console.error('    register [--help]    Register a new user account with the server');
        console.error('    import   [--help]    Import data into the server');
        console.error('    schema   [--help]    Obtain the JSON schema for a given server');
        console.error('    auth     [--help]    Obtain the JSON Auth document');
        console.error('    bbox     [--help]    Download data via bbox from a given server');
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
    } else if (argv.version) {
        console.error('hecate-cli@' + settings.version);
        process.exit(0);
    }

    const command = (err, hecate) => {
        if (err) throw err;

        if (!hecate._[argv._[2]] || !hecate._[argv._[2]].cli) {
            console.error();
            console.error('subcommand not found! Run with no args for help');
            console.error();
            process.exit(1);
        } else if (argv.help) {
            return hecate[argv._[2]].help();
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
                type: 'string',
                required: 'true',
                default: hecate.port
            }], (err, res) => {
                if (err) throw err;

                hecate.url = res.url;
                hecate.port = res.port;

                return run();
            });
        } else {
            return run();
        }

        function run() {
            hecate.auth({}, (err, auth_rules) => {
                if (err) throw err;

                hecate.auth_rules = auth_rules;

                hecate._[argv._[2]].cli(argv);
            });
        }
    };

    if (argv.stack) {
        Hecate.stack(argv.stack, command);
    } else {
        command(null, new Hecate(argv));
    }

}
