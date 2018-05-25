'use strict';
const prompt = require('prompt');
const getDelta = require('../util/getDelta.js');
const getFeatureHistory = require('../util/getFeatureHistory.js');
const async = require('async');
const _ = require('underscore');
const auth = require('../util/get_auth');


class Revert {
  constructor(api) {
    this.api = api;
  }

  help() {
    console.error('');
    console.error('Revert data from an specified delta');
    console.error('');
    console.error('usage: cli.js revert');
    console.error('');
  }

  cli(options) {
    prompt.message = '$';
    prompt.start();

    let args = [{
      name: 'deltaId',
      message: 'delta id to be reverted',
      required: true,
      type: 'number',
      default: options.deltaId
    }];

    if (this.api.auth_rules && this.api.auth_rules.feature.create !== 'public') {
      args = args.concat(auth(options));
    }

    prompt.get(args, (err, argv) => {

      argv.url = this.api.url;
      argv.port = this.api.port;

      this.revert(argv);
    });
  }

  // Initialize reversion according to the given delta id.
  revert(options) {
    this.validateArguments(options);
    getDelta(options, (res) => {
      if (res.statusCode !== 200) throw new Error(`Error while reverting: ${res.body}`);

      const featCollectionToRevert = res.body.features;
      if (featCollectionToRevert.features.length === 0) return console.error('There are no features to revert.');
      this.getModifiedFeatureCollection(options, featCollectionToRevert.features, (featureCollection) => {
        if (featureCollection.length === 0) console.error('No new feature collection was found!');
        else {
          options.input = featureCollection;
          options.message = `Revert: ${featCollectionToRevert.message}`;
          this.api.import.main(options, (err) => {
            if (err) throw err;
            console.error('ok - reverted delta');
          });
        }
      });
    });
  }

  validateArguments(argv) {
    if (!argv.url) throw new Error('url is required');
    if (!argv.port) throw new Error('port is required');
    if (!argv.username) throw new Error('username is required');
    if (!argv.password) throw new Error('password is required');
    if (!argv.deltaId) throw new Error('deltaId is required');
  }

  // Modify feature collection according to the options: keep/keep all, revert/revert all
  getModifiedFeatureCollection(options, featureCollection, callback) {
    if (!options) throw new Error('options cannot be undefined');
    if (!featureCollection) throw new Error('featureCollection cannot be undefined');

    let revertAllFeatures = false;

    const modifiedFeatureCollection = [];

    console.error(`ok - start reversion of ${featureCollection.length} features`);
    console.error('Type keep(k) | keep all(ka) | revert(r) | revert all(ra)');


    // Evaluate whether to revert or not each feature.
    async.eachSeries(featureCollection, (feature, cb) => {
      getFeatureHistory(options, feature.id, (response) => {
        if (response.statusCode !== 200) throw new Error(`ERROR: ${response.body.reason}`);

        if (!this.hasFeatureChanged(response.body, feature)) cb();

        else if (revertAllFeatures) {
          const rolBackFeature = this.revertFeature(response.body, feature);
          if (rolBackFeature) modifiedFeatureCollection.push(rolBackFeature);
          cb();
        } else {
          // Ask the action for each feature that has changed
          this.askForAction(feature, (action) => {
            if (action === 'ka') return callback(modifiedFeatureCollection);
            else if (action === 'r' || action === 'ra') {
              if (action === 'ra') revertAllFeatures = true;
              const rolBackFeature = this.revertFeature(response.body, feature);
              if (rolBackFeature) modifiedFeatureCollection.push(rolBackFeature);
            }
            cb();
          });
        }
      });
    }, (err) => {
      if (err) throw err;
      callback(modifiedFeatureCollection);
    });
  }

  // Compare if there any change between the feature to revert to and the current feature
  hasFeatureChanged(historyList, feature) {
    if (!historyList) throw new Error('The historyList cannot be undefined.');
    if (historyList.length === 0) throw new Error('The historyList cannot be empty.');
    if (!feature) throw new Error('The feature cannot be empty.');

    if (historyList.length === 1) return true;

    return this.getRevertToFeature(historyList, feature, (revertToFeature) => {
      if (!revertToFeature) throw new Error('Feature to rever to could not be defined');

      const currentFeature = historyList[0].feat;

      // Omit version and action properties since these change which each upload
      const omitPropList = ['version', 'action'];

      if (_.isEqual(_.omit(revertToFeature, omitPropList), _.omit(currentFeature, omitPropList))) return false;
      return true;
    });
  }


  // Ask to keep/revert individual/all features
  askForAction(feature, callback) {
    console.error(`Feature ${feature.id} current version in server is ${feature.version ? feature.version : 0}`);
    prompt.get({
      name: 'action',
      pattern: /^(r|ra|k|ka)$/,
      message: 'Action must be k,ka, r or ra',
      type: 'string',
      required: true,
      default: 'ra'
    }, (err, options) => {
      if (err) throw err;
      return callback(options.action);
    });
  }

  // Revert feature only if the action is r or ra
  revertFeature(historyList, feature) {
    if (!historyList) throw new Error('The historyList cannot be empty.');
    if (!feature) throw new Error('The feature cannot be empty.');

    return this.getRevertToFeature(historyList, feature, (revertToFeature) => {
      if (!revertToFeature) throw new Error('Feature to rever to could not be defined');

      const currentFeature = historyList[0].feat;
      if (feature.action === 'create' || feature.action === 'restore') {
        feature.action = 'delete';
        feature.properties = null;
        feature.geometry = null;
      } else {
        feature.action = feature.action === 'delete' ? 'restore' : 'modify';
        feature.properties = revertToFeature.properties;
        feature.geometry = revertToFeature.geometry;
      }

      feature.version = currentFeature.version ? currentFeature.version + 1 : 1;

      return feature;
    });
  }

  getRevertToFeature(historyList, feature, callback) {
    if (!historyList) throw new Error('The historyList cannot be empty.');
    if (!feature) throw new Error('The feature cannot be empty.');

    let revertToFeature;

    for (let i = 0; i < historyList.length; i++) {
      if (_.isEqual(historyList[i].feat, feature)) {
        if (feature.action === 'create') {
          feature.geometry = null;
          feature.properties = null;
          revertToFeature = feature;
        } else revertToFeature = historyList[i + 1].feat;
        break;
      }
    }

    if (!revertToFeature) throw new Error('Feature to revert was not found in the history list.');
    return callback(revertToFeature);
  }
}


module.exports = Revert;
