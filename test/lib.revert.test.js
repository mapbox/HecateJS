'use strict';

const Hecate = require('../cli.js');

const test = require('tape');
const nock = require('nock');

test('Clean revert of single delta', (t) => {
    const hecate = new Hecate({
        url: 'http://localhost:7777'
    });

    nock('http://localhost:7777')
        .get('/api/delta/2')
            .reply(200, {
                features: {
                    type: 'FeatureCollection',
                    features: [{
                        id: 1,
                        version: 2,
                        action: 'modify',
                        geometry:{
                            type: 'Point',
                            coordinates: [-73.2055358886719,44.4822540283203]
                        }
                    }]
                }
            })
        .get('/api/data/feature/1/history')
            .reply(200, [{
                feat: {
                    id: 1,
                    type: 'Feature',
                    action: 'modify',
                    version: 2,
                    properties: {
                        modified: true
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [ 0.0, 0.0 ]
                    }
                }
            },{
                feat: {
                    id: 1,
                    type: 'Feature',
                    action: 'create',
                    version: 1,
                    properties: {
                        created: true
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [ 1.0, 1.0 ]
                    }
                }
            }]);

    hecate._.revert.deltas({
        start: 2,
        end: 2
    }, (err, res) => {
        t.error(err);
        t.end();
    });
});

test('Clean revert of multiple deltas', (t) => {
    t.end();
});

test('Failed revert as feature exists multiple times accross detlas', (t) => {
    t.end();
});

test('Failed revert as feature has been edited since desired revert', (t) => {
    t.end();
});
