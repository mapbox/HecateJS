'use strict';
const getFeatureHistory = require('./getFeatureHistory');
const getDelta = require('./getDelta');
const getDeltas = require('./getDeltas');
const async = require('async');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt');

function getDeletedFeaturesByDelta(argv, callback) {
    const deletedFeatures = [];

    getDelta(argv, (err, res) => {
        if (err) return callback(err);
        if (!res.body || !res.body.features) {
            console.error(`warning - could not get features for delta ${argv.deltaId}`);
            return callback(null, deletedFeatures);
        }
        let features = res.body.features.features;

        if (!features.length) {
            console.error(`warning - there are no features for delta ${argv.deltaId}`);
            return callback(null, deletedFeatures);
        }

        features = features.filter((feature) => feature.action === 'delete');

        if (!features.length) {
            console.error(`ok - there are no deleted features in delta ${argv.deltaId}.`);
            return callback(null, deletedFeatures);
        }

        console.error(`ok - there are ${features.length} deleted features for delta ${argv.deltaId}.`);

        async.eachSeries(features, (feature, cb) => {
            const id = feature.id;
            getFeatureHistory(argv, id, (err, response) => {
                if (err) return cb();
                if (!Array.isArray(response.body)) {
                    console.error(`not ok - history of ${id} was not retrieved.`);
                    return cb();
                }

                const history = response.body;
                const restoreFeature = history[1].feat;
                delete restoreFeature.action;
                delete restoreFeature.id;
                delete restoreFeature.key;
                delete restoreFeature.version;

                deletedFeatures.push(JSON.stringify(restoreFeature));
                cb();
            });
        }, (err) => {
            if (err) return callback(err);
            callback(null, deletedFeatures);
        });
    });
}

function getDeletedFeatures(argv, outputPath) {
    if (!argv.deltaIds || !argv.deltaIds.length) return console.error('not ok - there are no delta ids');
    let deleted = [];
    let count = 0;

    console.error('ok - starting looking by deltas.');

    async.eachSeries(argv.deltaIds, (deltaId, cb) => {
        argv.deltaId = deltaId;
        getDeletedFeaturesByDelta(argv, (err, features) => {
            if (err) return cb();
            count += features.length;
            deleted = [...deleted, ...features];
            cb();
        });
    }, (err) => {
        if (err) throw err;
        console.error(`ok - found ${count} deleted features. Check file \`${outputPath}\``);
        fs.writeFileSync(outputPath, deleted.join('\n'));
    });
}
module.exports = getDeletedFeatures;

function chooseDelta(callback) {
    prompt.get({
        name: 'include',
        pattern: /^(yes|no)$/,
        message: 'value is yes or no',
        type: 'string',
        required: true,
        default: 'yes'
    }, (err, options) => {
        if (err) return callback(err);
        callback(null, options.include);
    });
}

if (!module.parent) {
    /* Usage
	node getDeletedFeatures.js <output>
	*/
    if (!process.argv[2]) return console.error('not ok - output path is required');

    const outputPath = path.resolve(process.argv[2]);
    const argv = { url: 'localhost', port: '8888' };
    const deltaIds = [];

    console.error('How many many deltas do you want to review?');

    prompt.get({
        name: 'limit',
        pattern: /\d/,
        message: 'limit of deltas, between 1 and 100',
        type: 'integer',
        required: true,
        default: 1
    }, (err, options) => {
        if (err) throw err;
        argv.limit = options.limit;

        getDeltas(argv, (err, deltas) => {
            console.error('Choose which deltas to consider to look for deleted features');
            async.eachSeries(deltas.body, (delta, cb) => {
                console.error(`comment: ${delta.props.comment} by user ${delta.username}`);
                chooseDelta((err, awnswer) => {
                    if (awnswer === 'yes') {
                        deltaIds.push(delta.id);
                    }
                    cb();
                });
            }, (err) => {
                if (err) throw err;
                if (!deltaIds.length) return console.error('ok - no deltas where choosen.');
                console.error(`ok - ${deltaIds.length} deltas were choosen.`);
                argv.deltaIds = deltaIds;
                getDeletedFeatures(argv, outputPath);
            });
        });

    });
}
