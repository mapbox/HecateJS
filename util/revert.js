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
    }

    
}

module.exports = inverse;
