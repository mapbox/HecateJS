'use strict';

const test = require('tape');
const revert = require('../util/revert');

test('Revert#Inverse', (t) => {
    t.throws(() => {
        revert.inverse();
    }, /Feature history cannot be empty/, 'Feature history cannot be empty');

    t.throws(() => {
        revert.inverse(false);
    }, /Feature history cannot be empty/, 'Feature history cannot be empty');

    t.throws(() => {
        revert.inverse({});
    }, /Feature history cannot be empty/, 'Feature history cannot be empty');

    t.throws(() => {
        revert.inverse([]);
    }, /Feature history cannot be empty/, 'Feature history cannot be empty');

    t.throws(() => {
        revert.inverse([{
            id: 1
        }], 1);
    }, /Feature: 1 missing initial create action/, 'Feature: 1 missing initial create action');

    t.throws(() => {
        revert.inverse([{
            id: 1,
            action: 'create'
        }, {
            id: 1,
            action: 'crazy'
        }], 2);
    }, /crazy not supported/, 'crazy not supported');

    t.deepEquals(revert.inverse([{
        id: 1,
        action: 'create',
        version: 1,
        properties: {
            desired: true
        },
        geometry: {
            type: 'Point',
            coordinates: [1.0, 1.0]
        }
    }, {
        id: 1,
        action: 'modify',
        version: 2,
        properties: {
            undesired: true
        },
        geometry: {
            type: 'Point',
            coordinates: [0.0, 0.0]
        }

    }], 2), {
        id: 1,
        type: 'Feature',
        action: 'modify',
        version: 2,
        properties: {
            desired: true
        },
        geometry: {
            type: 'Point',
            coordinates: [1.0, 1.0]
        }
    }, 'modify->modify');

    t.deepEquals(revert.inverse([{
        id: 1,
        action: 'create',
        version: 1,
        properties: {
            desired: true
        },
        geometry: {
            type: 'Point',
            coordinates: [1.0, 1.0]
        }
    }, {
        id: 1,
        action: 'delete',
        version: 2,
        properties: null,
        geometry: null
    }], 2), {
        id: 1,
        type: 'Feature',
        action: 'restore',
        version: 2,
        properties: {
            desired: true
        },
        geometry: {
            type: 'Point',
            coordinates: [1.0, 1.0]
        }
    }, 'delete => restore');

    t.deepEquals(revert.inverse([{
        id: 1,
        action: 'create',
        version: 1,
        properties: {
            desired: true
        },
        geometry: {
            type: 'Point',
            coordinates: [1.0, 1.0]
        }
    }, {
        id: 1,
        action: 'delete',
        version: 2,
        properties: null,
        geometry: null
    },{
        id: 1,
        action: 'restore',
        version: 3,
        properties: {
            undesired: true
        },
        geometry: {
            type: 'Point',
            coordinates: [0,0]
        }
    }], 3), {
        id: 1,
        type: 'Feature',
        action: 'delete',
        version: 3,
        properties: null,
        geometry: null
    }, 'restore => delete');

    t.deepEquals(revert.inverse([{
        id: 1,
        action: 'create',
        version: 1,
        properties: {
            desired: true
        },
        geometry: {
            type: 'Point',
            coordinates: [1.0, 1.0]
        }
    }], 1), {
        id: 1,
        type: 'Feature',
        action: 'delete',
        version: 1,
        properties: null,
        geometry: null
    }, 'create => delete');

    t.end();
});

test('Revert#createCache', (t) => {
    const db = revert.createCache();

    t.equals(db.inTransaction, false);
    t.equals(db.open, true);
    t.equals(db.memory, false);
    t.equals(db.readonly, false);
    t.ok(/\/tmp\/revert\..*.\.sqlite/.test(db.name));

    t.end();
});
