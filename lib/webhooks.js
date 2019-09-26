#!/usr/bin/env node

'use strict';

const request = require('request');
const prompt = require('prompt');
const auth = require('../util/get_auth');

/**
 * @class Webhooks
 * @public
 *
 * @see {@link https://github.com/mapbox/hecate#webhooks|Hecate Documentation}
 */
class Webhooks {
    constructor(api) {
        this.api = api;
    }

    help() {
        console.error();
        console.error('List, Create, Manage & Delete hecate webhooks');
        console.error();
        console.error('Usage: cli.js webhooks <subcommand>');
        console.error();
        console.error('<subcommand>:');
        console.error('    list     List webhooks currently active on the server');
        console.error('    get      Get a specific webhook');
        console.error('    create   Create a new webhook');
        console.error('    update   Update an existing webhook');
        console.error('    delete   Delete an existing webhook');
        console.error();
    }

    /**
     * Queries hecate /api/webhooks endpoint
     *
     * @param {!Object} options Options for making a request to the hecate /api/webhooks endpoint
     *
     * @param {function} cb (err, res) style callback function
     */
    list(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;

            options.output = process.stdout;

            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.webhooks.list !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
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
            request.get({
                json: true,
                url: new URL('/api/webhooks', self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(JSON.stringify(res.body)));

                return cb(null, res.body);
            });
        }

        function cli(err, hooks) {
            if (err) throw err;

            console.log(JSON.stringify(hooks));
        }
    }

    /**
     * Get a specific webhook given the ID
     *
     * @param {!Object} options Options for making a request to the hecate /api/webhooks endpoint
     * @param {Number} options.id ID of the webhook to retreive
     *
     * @param {function} cb (err, res) style callback function
     */
    get(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;

            options.output = process.stdout;

            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [{
                name: 'id',
                message: 'Webhook ID',
                type: 'string',
                required: 'true',
                default: options.id
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.webhooks.list !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                prompt.stop();

                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                options.id = argv.id;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.id) return cb(new Error('options.id required'));

            request({
                method: 'GET',
                url: new URL(`/api/webhooks/${options.id}`, self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(res.body));

                return cb(null, JSON.parse(res.body));
            });
        }

        function cli(err, hook) {
            if (err) throw err;

            console.log(JSON.stringify(hook));
        }
    }

    /**
     * Delete a specific webhook given the ID
     *
     * @param {!Object} options Options for making a request to the hecate /api/webhooks endpoint
     * @param {Number} options.id ID of the webhook to delete
     *
     * @param {function} cb (err, res) style callback function
     */
    delete(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;

            options.output = process.stdout;

            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [{
                name: 'id',
                message: 'Webhook ID',
                type: 'string',
                required: 'true',
                default: options.id
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.webhooks.delete !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                prompt.stop();

                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                options.id = argv.id;

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.id) return cb(new Error('options.id required'));

            request({
                method: 'DELETE',
                url: new URL(`/api/webhooks/${options.id}`, self.api.url),
                auth: self.api.user
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(res.body));

                return cb(null, true);
            });
        }

        function cli(err) {
            if (err) throw err;

            console.log(true);
        }
    }

    /**
     * Update a given webhook ID
     *
     * @param {!Object} options Options for making a request to the hecate /api/webhooks endpoint
     * @param {Number} options.id ID of the webhook to update
     * @param {String} options.name Name of the webhook
     * @param {String} options.url URL of the webhook
     * @param {Array<String>} options.actions server actions the webhook should be fired on
     *
     * @param {function} cb (err, res) style callback function
     */
    update(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;

            options.output = process.stdout;

            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [{
                name: 'id',
                message: 'Webhook ID',
                type: 'string',
                required: 'true',
                default: options.id
            },{
                name: 'name',
                message: 'Webhook Name',
                type: 'string',
                required: 'true',
                default: options.name
            },{
                name: 'url',
                message: 'Webhook URL',
                type: 'string',
                required: 'true',
                default: options.url
            },{
                name: 'actions',
                message: 'Webhook Actions (comma separated)',
                type: 'string',
                required: 'true',
                default: options.actions
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.webhooks.update !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                prompt.stop();

                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                options.id = argv.id;
                options.name = argv.name;
                options.url = argv.url;
                options.actions = argv.actions.split(',');

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.id) return cb(new Error('options.id required'));
            if (!options.name) return cb(new Error('options.name required'));
            if (!options.url) return cb(new Error('options.url required'));
            if (!options.actions) return cb(new Error('options.actions required'));

            request({
                method: 'POST',
                json: true,
                url: new URL(`/api/webhooks/${options.id}`, self.api.url),
                auth: self.api.user,
                body: {
                    name: options.name,
                    url: options.url,
                    actions: options.actions
                }
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(res.body));

                return cb(null, true);
            });
        }

        function cli(err) {
            if (err) throw err;

            console.log(true);
        }
    }

    /**
     * Create a new webhook
     *
     * @param {!Object} options Options for making a request to the hecate /api/webhooks endpoint
     * @param {String} options.name Name of the webhook
     * @param {String} options.url URL of the webhook
     * @param {Array<String>} options.actions server actions the webhook should be fired on
     *
     * @param {function} cb (err, res) style callback function
     */
    create(options = {}, cb) {
        const self = this;

        if (!options) options = {};

        if (options.script) {
            cb = cli;

            options.output = process.stdout;

            return main();
        } else if (options.cli) {
            cb = cli;

            prompt.message = '$';
            prompt.start({
                stdout: process.stderr
            });

            let args = [{
                name: 'name',
                message: 'Webhook Name',
                type: 'string',
                required: 'true',
                default: options.name
            },{
                name: 'url',
                message: 'Webhook URL',
                type: 'string',
                required: 'true',
                default: options.url
            },{
                name: 'actions',
                message: 'Webhook Actions (comma separated)',
                type: 'string',
                required: 'true',
                default: options.actions
            }];

            if (!self.api.user && self.api.auth_rules && self.api.auth_rules.webhooks.update !== 'public') {
                args = args.concat(auth(self.api.user));
            }

            prompt.get(args, (err, argv) => {
                prompt.stop();

                if (argv.hecate_username) {
                    self.api.user = {
                        username: argv.hecate_username,
                        password: argv.hecate_password
                    };
                }

                options.name = argv.name;
                options.url = argv.url;
                options.actions = argv.actions.split(',');

                return main();
            });
        } else {
            return main();
        }

        function main() {
            if (!options.name) return cb(new Error('options.name required'));
            if (!options.url) return cb(new Error('options.url required'));
            if (!options.actions) return cb(new Error('options.actions required'));

            request({
                method: 'POST',
                json: true,
                url: new URL('/api/webhooks', self.api.url),
                auth: self.api.user,
                body: {
                    name: options.name,
                    url: options.url,
                    actions: options.actions
                }
            }, (err, res) => {
                if (err) return cb(err);
                if (res.statusCode !== 200) return cb(new Error(res.body));

                return cb(null, true);
            });
        }

        function cli(err) {
            if (err) throw err;

            console.log(true);
        }
    }
}

module.exports = Webhooks;
