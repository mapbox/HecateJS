'use strict';

const test = require('tape').test;
const revert = new(require('../lib/revert'))({});

// Test revertFeature() when history list size > 3
test('Assert fails due to missing parameters', (t) => {
    revert.revertFeature(null, 'feature', 'revertToFeature', (err) => { t.deepEquals(err.message, 'The currentFeature cannot undefined.', 'The currentFeature cannot undefined.'); });
    revert.revertFeature('currentFeature', null, 'revertToFeature', (err) => { t.deepEquals(err.message, 'The feature cannot be empty.', 'The feature cannot be empty.'); });
    revert.revertFeature('currentFeature', 'feature', null, (err) => { t.deepEquals(err.message, 'The feature to revert to cannot be empty.', 'The feature to revert to cannot be empty.'); });
    t.end();
});

test('Assert revert when action = create in long history list', (t) => {
    const historyList = [
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 5 } },
        { feat: { action: 'restore', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 4 } },
        { feat: { action: 'delete', geometry: null, properties: {}, version: 3 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 2 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 } },
        { feat: { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } } }
    ];

    const currentFeature = historyList[0].feat;
    const feature = historyList[5].feat;
    const revertToFeature = historyList[5].feat;
    const expectedRevertedFeature = { action: 'delete', geometry: null, properties: {}, version: 6 };

    revert.revertFeature(currentFeature, feature, revertToFeature, (err, revertedFeature) => {
        t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to delete is the right one');
    });

    t.end();
});

test('Assert revert when action = delete in long history list', (t) => {
    const historyList = [
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 5 } },
        { feat: { action: 'restore', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 4 } },
        { feat: { action: 'delete', geometry: null, properties: {}, version: 3 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 2 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 } },
        { feat: { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } } }
    ];

    const currentFeature = historyList[0].feat;
    const feature = historyList[2].feat;
    const revertToFeature = historyList[3].feat;
    const expectedRevertedFeature = { action: 'restore', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 6 };

    revert.revertFeature(currentFeature, feature, revertToFeature, (err, revertedFeature) => {
        t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to restore is the right one');
    });
    t.end();
});

test('Assert revert when action = modify in long history list', (t) => {
    const historyList = [
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 5 } },
        { feat: { action: 'restore', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 4 } },
        { feat: { action: 'delete', geometry: null, properties: {}, version: 3 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 2 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 } },
        { feat: { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } } }
    ];

    const currentFeature = historyList[0].feat;
    const feature = historyList[3].feat;
    const revertToFeature = historyList[4].feat;
    const expectedRevertedFeature = { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 6 };

    revert.revertFeature(currentFeature, feature, revertToFeature, (err, revertedFeature) => {
        t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to modify is the right one');
    });
    t.end();
});


test('Assert revert when action = restore in long history list', (t) => {
    const historyList = [
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 5 } },
        { feat: { action: 'restore', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 4 } },
        { feat: { action: 'delete', geometry: null, properties: {}, version: 3 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 2 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 } },
        { feat: { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } } }
    ];

    const currentFeature = historyList[0].feat;
    const feature = historyList[1].feat;
    const revertToFeature = historyList[2].feat;
    const expectedRevertedFeature = { action: 'delete', geometry: null, properties: {}, version: 6 };

    revert.revertFeature(currentFeature, feature, revertToFeature, (err, revertedFeature) => {
        t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to delete is the right one');
    });
    t.end();
});

// Test getRevertToFeature() when a large list
test('Assert fail due to missing parameter in getRevertToFeature', (t) => {
    revert.getRevertToFeature(null, 'feature', (err) => { t.deepEquals(err.message, 'The historyList cannot be empty.', 'The historyList cannot be empty.'); });
    revert.getRevertToFeature([{ 'feat': 'fake' }], null, (err) => { t.deepEquals(err.message, 'The feature cannot be empty.', 'The feature cannot be empty.'); });
    t.end();
});

test('Assert getting feature to revert to when history list is long', (t) => {
    const historyList = [
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 5 } },
        { feat: { action: 'restore', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 4 } },
        { feat: { action: 'delete', geometry: null, properties: {}, version: 3 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 2 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 } },
        { feat: { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } } }
    ];
    revert.getRevertToFeature(historyList, { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'create', geometry: null, properties: {} }, 'feature is the same first created one');
    });
    revert.getRevertToFeature(historyList, { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } }, 'feature is previous to modified');
    });
    revert.getRevertToFeature(historyList, { action: 'delete', geometry: null, properties: {}, version: 3 }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 2 }, 'feature is previous to deleted');
    });
    revert.getRevertToFeature(historyList, { action: 'restore', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 4 }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'delete', geometry: null, properties: {}, version: 3 }, 'feature is previous to restored');
    });
    revert.getRevertToFeature(historyList, { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 5 }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'restore', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 4 }, 'feature is previous to restored');
    });

    t.end();
});

test('Assert getting feature to revert to when history list size is 3', (t) => {
    const historyList = [
        { feat: { action: 'delete', geometry: null, properties: {}, version: 2 } },
        { feat: { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 } },
        { feat: { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } } }
    ];
    revert.getRevertToFeature(historyList, { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'create', geometry: null, properties: {} }, 'feature is the same first created one');
    });
    revert.getRevertToFeature(historyList, { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } }, 'feature is previous to modified');
    });
    revert.getRevertToFeature(historyList, { action: 'delete', geometry: null, properties: {}, version: 2 }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 }, 'feature is previous to deleted');
    });
    t.end();
});

test('Assert getting feature to revert to when history list size is 2', (t) => {
    const historyList = [
        { feat: { action: 'delete', geometry: null, properties: {}, version: 1 } },
        { feat: { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } } }
    ];
    revert.getRevertToFeature(historyList, { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'create', geometry: null, properties: {} }, 'feature is the same first created one');
    });
    revert.getRevertToFeature(historyList, { action: 'delete', geometry: null, properties: {}, version: 1 }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } }, 'feature is previous to deleted');
    });
    t.end();
});

test('Assert getting feature to revert to when history list size is 1', (t) => {
    const historyList = [
        { feat: { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } } }
    ];
    revert.getRevertToFeature(historyList, { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } }, (err, revertToFeature) => {
        t.deepEquals(revertToFeature, { action: 'create', geometry: null, properties: {} }, 'feature is the same first created one');
    });
    t.end();
});

test('Assert fail when feature to revert was not found', (t) => {
    const historyList = [
        { feat: { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' } } }
    ];
    revert.getRevertToFeature(historyList, { action: 'create', geometry: { coordinates: [13, 52] }, properties: { address: 'mnp' } }, (err) => {
        t.deepEquals(err.message, 'Feature to revert was not found in the history list.', 'Feature to revert was not found in the history list.');
    });
    t.end();
});

test('Evaluate if feature has changed', (t) => {
    const currentFeature = { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 5 };
    t.deepEquals(revert.hasFeatureChanged(currentFeature, { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'xyz' }, version: 1 }), false, 'feature has not changed');
    t.deepEquals(revert.hasFeatureChanged(currentFeature, { action: 'modify', geometry: { coordinates: [13, 52] }, properties: { address: 'abc' }, version: 2 }), true, 'feature has changed');
    t.deepEquals(revert.hasFeatureChanged({ action: 'delete', geometry: null, properties: null, version: 5 }, { action: 'create', geometry: null, properties: null }), false, 'feature has not changed');
    t.end();
});

// revert()
test('Assert fails due to missing parameter to revert delta', (t) => {
    revert.main({ port: '7777', username: 'user', password: 'psw', deltaId: 7 }, (err) => { t.deepEquals(err.message, 'url is required', 'url is required'); });
    revert.main({ url: 'url', username: 'user', password: 'psw', deltaId: 7 }, (err) => { t.deepEquals(err.message, 'port is required', 'port is required'); });
    revert.main({ url: 'url', port: '7777', password: 'psw', deltaId: 7 }, (err) => { t.deepEquals(err.message, 'username is required', 'username is required'); });
    revert.main({ url: 'url', port: '7777', username: 'user', deltaId: 7 }, (err) => { t.deepEquals(err.message, 'password is required', 'password is required'); });
    revert.main({ url: 'url', port: '7777', username: 'user', password: 'psw' }, (err) => { t.deepEquals(err.message, 'deltaId is required', 'deltaId is required'); });
    t.end();
});
