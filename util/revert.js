'use strict';

const { promisify } = require('util');
const Sqlite = require('better-sqlite3');

/**
 * Given the feature history for a single feature,
 * revert the last feature in the history to that
 * of the second last
 *
 * Example:
 *
 * User wants to revert/rollback the changes made in v4 to be those in v3
 *
 * Current State:
 * Feature: 123
 * [ v1, v2, v3, v4 ]
 *
 * End State:
 * Feature:123
 * [ v1, v2, v3, v4, v5 ]
 *
 * Where v5 is the calculated inverse operation of v4
 *
 * Inverses:
 *
 * Below is the table of inverses, the action that must be applied
 * to "undo" a given feature action
 *
 * | Initial Action | Inverse |
 * | -------------- | ------- |
 * | Create         | Delete  |
 * | Modify         | Modify  |
 * | Delete         | Restore |
 * | Restore        | Delete  |
 *
 * See the Hecate docs for more information about feature actions
 * and versioning
 *
 * @param {Array[Object]} history Array of features accross all verisons of the feature
 *
 * @returns {Object} Returns calculated inverse feature
 */
function inverse(history) {
    history = history.sort((a, b) => {
        return a.version ? a.version : 1 - b.version ? b.version : 1;
    });

    if (!history || !Array.isArray(history) || history.length === 0) {
        throw new Error('Feature history cannot be empty');

    // If the history length is 1, the operation must be a
    // create operation, otherwise history is missing
    } else if (history.length >= 1 && history[0].action !== 'create') {
        throw new Error(`Feature: ${history[0].id} missing initial create action`);

    // Feature has just been created and should be deleted
    } else if (history.length === 1) {
        const feat = history[0];

        return {
            id: feat.id,
            action: 'delete',
            version: 1,
            type: 'Feature',
            properties: null,
            geometry: null
        };
    } else {
        const desired = history[history.length - 2];
        const latest = history[history.length - 1];

        let action;
        if (latest.action === 'modify') {
            action = 'modify';
        } else if (latest.action === 'delete') {
            action = 'restore';
        } else if (latest.action === 'restore') {
            action = 'delete';
        } else {
            throw new Error(`${latest.action} not supported`);
        }

        return {
            id: latest.id,
            type: 'Feature',
            action: action,
            version: latest.version,
            properties: desired.properties,
            geometry: desired.geometry
        };
    }
}

/**
 * Iterate over Sqlite3 database containing features to revert to previous state
 *
 * Writes inversion to given writable stream
 *
 * @param {Object} db sqlite3 db to iterate over
 * @param {Stream} stream output stream to write inverted features to
 */
function iterate(db, stream) {
    const stmt = db.prepare(`
        SELECT
            feature
        FROM
            features;
    `);

    for (let history of stmt.iterate()) {
        history = JSON.parse(history.feature).map((feat) => {
            return feat.feat;
        });

        const inv = inverse(history);

        stream.write(JSON.stringify(inv) + '\n');
    }
}

/**
 * Given a start/end range for a set of deltas, download
 * each of the deltas, then iterate through each feature,
 * retreiving it's history and writing it to disk
 *
 * @param {Object} options options object
 * @param {Number} options.start Delta Start ID
 * @param {Number} options.end Delta End ID
 *
 * @returns {Promise}
 */
async function cache(options, api) {
    const db = createCache();

    const getDelta = promisify(api.getDelta);
    const getFeatureHistory = promisify(api.getFeatureHistory);

    const stmt = db.prepare(`
        INSERT INTO features (id, feature)
            VALUES (?, ?);
    `);

    for (let i = options.start; i <= options.end; i++) {
        const delta = await getDelta({
            delta: i
        });

        for (const feat of delta.features.features) {
            const history = await getFeatureHistory({
                feature: feat.id
            });

            stmt.run(feat.id, JSON.stringify(history));

        }
    }

    return db;

}

/**
 * Create a new reversion sqlite3 database, initialize it with table
 * definitions, and pass back db object to caller
 *
 * @returns {Object} Sqlite3 Database Handler
 */
function createCache() {
    const db = new Sqlite(`/tmp/revert.${Math.random().toString(36).substring(7)}.sqlite`);

    db.exec(`
        CREATE TABLE features (
            id      INTEGER PRIMARY KEY,
            feature TEXT NOT NULL
        );
    `);

    return db;
}

module.exports.inverse = inverse;
module.exports.iterate = iterate;
module.exports.cache = cache;
