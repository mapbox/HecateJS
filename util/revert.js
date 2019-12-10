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
    if (!history || !Array.isArray(history) || history.length === 0) {
        throw new Error('Feature history cannot be empty');

    // If the history length is 1, the operation must be a
    // create operation, otherwise history is missing
    } else if (history.length >= 1 && history[0].action !== 'create') {
        throw new Error(`Feature: ${history[0].id} missing initial create action`);

    // Feature has just been created and should be deleted
    } else if (history.length === 1) {
        let feat = history[0];

        return {
            id: feat.id,
            action: 'delete',
            version: 1,
            type: 'Feature',
            properties: null,
            geometry: null
        }
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
        }
    }
}

module.exports = inverse;
