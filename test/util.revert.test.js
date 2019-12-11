'use strict';

const test = require('tape');
const revert = require('../util/revert').inverse;

test('Revert', (t) => {
    t.throws(() => {
        revert();
    }, /Feature history cannot be empty/, 'Feature history cannot be empty');

    t.throws(() => {
        revert(false);
    }, /Feature history cannot be empty/, 'Feature history cannot be empty');

    t.throws(() => {
        revert({});
    }, /Feature history cannot be empty/, 'Feature history cannot be empty');

    t.throws(() => {
        revert([]);
    }, /Feature history cannot be empty/, 'Feature history cannot be empty');

    t.throws(() => {
        revert([{
            id: 1
        }]);
    }, /Feature: 1 missing initial create action/, 'Feature: 1 missing initial create action');

    t.throws(() => {
        revert([{
            id: 1,
            action: 'create'
        }, {
            id: 1,
            action: 'crazy'
        }]);
    }, /crazy not supported/, 'crazy not supported');

    t.deepEquals(revert([{
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

    }]), {
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

    t.deepEquals(revert([{
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
    }]), {
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

    t.deepEquals(revert([{
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
    }]), {
        id: 1,
        type: 'Feature',
        action: 'delete',
        version: 3,
        properties: null,
        geometry: null
    }, 'restore => delete');

    t.deepEquals(revert([{
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
    }]), {
        id: 1,
        type: 'Feature',
        action: 'delete',
        version: 1,
        properties: null,
        geometry: null
    }, 'create => delete');

    t.end();
});
