'use strict';

const { promisify } = require('util');
const Sqlite = require('better-sqlite3');
const Q = require('d3-queue').queue;
const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Given the feature history for a single feature and the version of the feature
 * to be reverted, calculate a feature that can be uploaded which will
 * restore the state of the feature to that of the version preceding
 * the version supplied
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
 * @param {Object[]} history Array of features accross all verisons of the feature
 * @param {number} version feature version that should be rolled back
 *
 * @returns {Object} Returns calculated inverse feature
 */
function inverse(history, version) {
    if (!history || !Array.isArray(history) || history.length === 0) {
        throw new Error('Feature history cannot be empty');
    } else {
        history = history.sort((a, b) => {
            return (a.version ? a.version : 1) - (b.version ? b.version : 1);
        });
    }

    if (!version || isNaN(version)) {
        throw new Error('Feature version cannot be empty');
    } else if (version > history.length) {
        throw new Error('version cannot be higher than feature history');

        // If the history length is 1, the operation must be a
        // create operation, otherwise history is missing
    } else if (history.length >= 1 && history[0].action !== 'create') {
        throw new Error(`Feature: ${history[0].id} missing initial create action`);

        // If the version to be reverted isn't the last element in the array
        // it is a "dirty revert" or a revert that could potentially be in conflict
        // with subsequent changes, these are not currently supported
    } else if (version < history.length) {
        throw new Error(`Feature: ${history[0].id} has been subsequenty edited. reversion not supported`);

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
        const desired = history[version - 2];
        const latest = history[version - 1];

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
            version,
            history
        FROM
            features;
    `);

    for (const row of stmt.iterate()) {
        const history = JSON.parse(row.history).map((feat) => {
            return feat.feat;
        });

        const inv = inverse(history, row.version);

        stream.write(JSON.stringify(inv) + '\n');
    }
}

/**
 * Given a start/end range for a set of deltas, download
 * each of the deltas, then iterate through each feature,
 * retreiving it's history and writing it to disk
 *
 * @param {Object} options options object
 * @param {number} options.start Delta Start ID
 * @param {number} options.end Delta End ID
 *
 * @returns {Promise}
 */
function cache(options, api) {
    return new Promise((resolve, reject) => {
        const db = createCache();

        const getDelta = promisify(api.getDelta);
        const getFeatureHistory = promisify(api.getFeatureHistory);

        const stmt = db.prepare(`
            INSERT INTO features (id, version, history)
                VALUES (?, ?, ?);
        `);

        deltai(options.start - 1);

        async function deltai(i) {
            if (i < options.end) {
                i++;
            } else {
                return resolve(db);
            }

            const delta = await getDelta({
                delta: i
            });

            const q = new Q(50);

            for (const feat of delta.features.features) {
                q.defer(async(feat, done) => {
                    const history = await getFeatureHistory({
                        feature: feat.id
                    });

                    try {
                        stmt.run(feat.id, feat.version, JSON.stringify(history));
                    } catch (err) {
                        if (err.message === 'UNIQUE constraint failed: features.id') {
                            return done(new Error(`Feature: ${feat.id} exists multiple times across deltas to revert. reversion not supported`));
                        } else {
                            return done(err);
                        }
                    }

                    return done();
                }, feat);
            }

            q.awaitAll((err) => {
                if (err) return reject(err);

                process.nextTick(() => {
                    deltai(i);
                });
            });
        }
    });
}

/**
 * Create a new reversion sqlite3 database, initialize it with table
 * definitions, and pass back db object to caller
 *
 * @returns {Object} Sqlite3 Database Handler
 */
function createCache() {
    const db = new Sqlite(path.resolve(os.tmpdir(), `revert.${Math.random().toString(36).substring(7)}.sqlite`));

    db.exec(`
        CREATE TABLE features (
            id      INTEGER PRIMARY KEY,
            version INTEGER NOT NULL,
            history TEXT NOT NULL
        );
    `);

    return db;
}

function cleanCache(db) {
    const name = db.name;

    db.close();

    fs.unlinkSync(name);
}

module.exports.inverse = inverse;
module.exports.iterate = iterate;
module.exports.cache = cache;
module.exports.createCache = createCache;
module.exports.cleanCache = cleanCache;
