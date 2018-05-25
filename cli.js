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
    this.auth_rules = api.auth_rules ? api.auth_rules : null;

    // Instantiate New Library Instances
    this.auth = new (require('./lib/auth'))(this);
    this.query = new (require('./lib/query'))(this);
    this.register = new (require('./lib/register'))(this);
    this.schema = new (require('./lib/schema'))(this);
    this.import = new (require('./lib/import'))(this);
    this.revert = new(require('./lib/revert'))(this);
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

  if (!argv._[2] || (!argv._[2] && argv.help)) {
    console.error('');
    console.error('usage: cli.js <command> [--version] [--help] [--stack <STACK NAME>]');
    console.error('');
    console.error('<command>');
    console.error('    help                 Displays this message');
    console.error('    register [--help]    Register a new user account with the server');
    console.error('    import   [--help]    Import data into the server');
    console.error('    schema   [--help]    Obtain the JSON schema for a given server');
    console.error('    auth     [--help]    Obtain the JSON Auth document');
    console.error('    query    [--help]    Download data from a given server');
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

  if (argv.stack) {
    Hecate.stack(argv.stack, command);
  } else {
    command(null, new Hecate());
  }

  function command(err, hecate) {
    if (err) throw err;

    if (!hecate[argv._[2]] || !hecate[argv._[2]].cli) {
      console.error();
      console.error('subcommand not found! Run with no args for help');
      console.error();
      process.exit(1);
    } else if (argv.help) {
      return hecate[argv._[2]].help();
    }

    prompt.message = '$';
    prompt.start();

    prompt.get([{
      name: 'url',
      message: 'URL to hecate instance',
      type: 'string',
      required: 'true',
      default: hecate.url
    },{
      name: 'port',
      message: '8000 for local, 8888 for connect.sh, 80 for --stack ELB',
      type: 'string',
      required: 'true',
      default: hecate.port
    }], (err, res) => {
      if (err) throw err;

      hecate.url = res.url;
      hecate.port = res.port;

      hecate.auth.main(hecate, (err, auth_rules) => {
        if (err) throw err;

        hecate.auth_rules = auth_rules;

        hecate[argv._[2]].cli(argv);
      });
    });
  }
}
