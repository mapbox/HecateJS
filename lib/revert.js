'use strict';
const prompt = require('prompt');
const getDelta = require('../util/getDelta.js');
const getFeatureHistory = require('../util/getFeatureHistory.js');
const async = require('async');
const _ = require('underscore');
const auth = require('../util/get_auth');
const getSession = require('../util/getSession');

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
        console.error('    revert       Revert a given delta ID');
        console.error();
    }

    revert(options = {}, callback) {
        const self = this;

        if (!options) options = {};

        if (options.script || !options.cli) throw new Error('Revert operations must be performed manually');

        prompt.message = '$';
        prompt.start({
            stdout: process.stderr
        });

        let args = [{
            name: 'deltaId',
            message: 'delta id to be reverted',
            required: true,
            type: 'number',
            default: options.deltaId
        }, {
            name: 'featureId',
            description: 'Feature ids [Optional]',
            message: 'feature or features id to be reverted, separated by commas',
            required: false,
            type: 'string',
            default: options.featureId
        }];

        if (self.api.auth_rules && self.api.auth_rules.feature.create !== 'public') {
            args = args.concat(auth(self.api.user));
        }

        prompt.get(args, (err, argv) => {
            if (argv.hecate_username) {
                self.api.user = {
                    username: argv.hecate_username,
                    password: argv.hecate_password
                };
            }

            getSession(argv, (error, res) => {
                if (error) throw error;
                if (res.statusCode !== 200) throw new Error(res.body);

                main(argv, (err) => {
                    if (err) throw err;
                    console.error('Finish reversion!');
                });
            });
        });

        function main() {
            if (!options.url) return callback(new Error('url is required'));
            if (!options.port) return callback(new Error('port is required'));
            if (!options.deltaId) return callback(new Error('deltaId is required'));

            getDelta(options, (err, res) => {
                if (err) return callback(err);
                if (res.statusCode !== 200) return callback(new Error(`Error while reverting: ${res.body}`));
                let featCollectionToRevert = res.body.features.features;

                if (featCollectionToRevert.length === 0) {
                    console.error('There are no features to revert.');
                    return callback();
                }

                if (options.featureId) {
                    const featureIdList = options.featureId.split(',').map((id) => { return parseInt(id); });

                    featCollectionToRevert = featCollectionToRevert.filter((feature) => {
                        if (featureIdList.indexOf(feature.id) !== -1) {
                            return feature;
                        }
                    });
                }

                self.getModifiedFeatureCollection(options, featCollectionToRevert, (err, featureCollection) => {
                    if (err) return callback(err);
                    if (featureCollection.length === 0) {
                        console.error('No new feature collection was found!');
                        callback();
                    } else {
                        options.input = featureCollection;
                        options.message = `Revert: ${res.body.features.message}`;
                        self.api.import.main(options, (err) => {
                            if (err) return callback(err);
                            console.error('ok - upload complete');
                            callback();
                        });
                    }
                });
            });
        }
    }

    // Modify feature collection according to the options: keep/keep all, revert/revert all
    getModifiedFeatureCollection(options, featureCollection, callback) {
        if (!options) return callback(new Error('Options to get modified feature collection cannot be undefined'));
        if (!featureCollection) return callback(new Error('Initial featureCollection cannot be undefined'));

        let revertAllFeatures = false;

        const modifiedFeatureCollection = [];

        console.error(`ok - start reversion of ${featureCollection.length} features`);
        console.error('Type keep(k) | keep all(ka) | revert(r) | revert all(ra)');


        // Evaluate whether to revert or not each feature.
        async.eachSeries(featureCollection, (feature, cb) => {
            getFeatureHistory(options, feature.id, (err, response) => {
                if (err) return callback(err);
                if (response.statusCode !== 200) return callback(new Error(`ERROR: ${response.body.reason}`));
                if (response.body.length === 0) return callback(new Error('ERROR: History feature collection cannot be empty'));

                const currentFeature = response.body[0].feat;

                this.getRevertToFeature(response.body, feature, (err, revertToFeature) => {
                    if (err) return callback(err);
                    if (!revertToFeature) return callback(new Error('Feature to revert to is undefined'));

                    if (!this.hasFeatureChanged(revertToFeature, currentFeature)) return cb();
                    if (revertAllFeatures || _.isEqual(currentFeature, feature)) {
                        this.revertFeature(currentFeature, feature, revertToFeature, (err, rolBackFeature) => {
                            if (err) return callback(err);
                            modifiedFeatureCollection.push(rolBackFeature);
                            cb();
                        });
                    } else {
                        // Ask the action for each feature that has changed
                        this.askForAction(response.body, (err, action) => {
                            if (err) return callback(err);
                            if (action === 'ka') return callback(null, modifiedFeatureCollection);
                            else if (action === 'r' || action === 'ra') {
                                if (action === 'ra') revertAllFeatures = true;
                                this.revertFeature(currentFeature, feature, revertToFeature, (err, rolBackFeature) => {
                                    if (err) return callback(err);
                                    modifiedFeatureCollection.push(rolBackFeature);
                                });
                            }
                            cb();
                        });
                    }
                });
            });
        }, (err) => {
            if (err) return callback(err);
            callback(null, modifiedFeatureCollection);
        });
    }

    getRevertToFeature(historyList, feature, callback) {
        if (!historyList) return callback(new Error('The historyList cannot be empty.'));
        if (!feature) return callback(new Error('The feature cannot be empty.'));

        let revertToFeature;

        for (let i = 0; i < historyList.length; i++) {
            if (_.isEqual(historyList[i].feat, feature)) {
                if (feature.action === 'create') {
                    revertToFeature = JSON.parse(JSON.stringify(feature));
                    revertToFeature.geometry = null;
                    revertToFeature.properties = {};
                } else revertToFeature = historyList[i + 1].feat;
                break;
            }
        }

        if (!revertToFeature) return callback(new Error('Feature to revert was not found in the history list.'));
        callback(null, revertToFeature);
    }

    // Compare if there any change between the feature to revert to and the current feature
    hasFeatureChanged(revertToFeature, currentFeature) {
        // Omit version and action properties since these change which each upload
        const omitPropList = ['version', 'action'];

        if (_.isEqual(_.omit(revertToFeature, omitPropList), _.omit(currentFeature, omitPropList))) return false;
        return true;
    }


    // Ask to keep/revert individual/all features
    askForAction(historyList, callback) {
        if (!historyList) return callback(new Error('historyList cannot be empty'));
        console.error(`Feature ${historyList[0].feat.id} current version in server is ${historyList[0].feat.version ? historyList[0].feat.version : 0}`);
        prompt.get({
            name: 'action',
            pattern: /^(r|ra|k|ka)$/,
            message: 'Action must be k,ka, r or ra',
            type: 'string',
            required: true,
            default: 'ra'
        }, (err, options) => {
            if (err) return callback(err);
            callback(null, options.action);
        });
    }

    // Revert feature only if the action is r or ra
    revertFeature(currentFeature, feature, revertToFeature, callback) {
        if (!currentFeature) return callback(new Error('The currentFeature cannot undefined.'));
        if (!feature) return callback(new Error('The feature cannot be empty.'));
        if (!revertToFeature) return callback(new Error('The feature to revert to cannot be empty.'));

        if (feature.action === 'create' || feature.action === 'restore') {
            revertToFeature.action = 'delete';
            revertToFeature.properties = {};
            revertToFeature.geometry = null;
        } else revertToFeature.action = (feature.action === 'delete') ? 'restore' : 'modify';

        revertToFeature.version = currentFeature.version ? currentFeature.version + 1 : 1;

        callback(null, revertToFeature);
    }
}

module.exports = Revert;
