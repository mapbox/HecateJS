'use strict';

const Hecate = require('../cli.js');

const test = require('tape');
const nock = require('nock');
const PassThrough = require('stream').PassThrough;

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
                    coordinates: [0.0, 0.0]
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
                    coordinates: [1.0, 1.0]
                }
            }
        }]);

    let buffer = '';
    const results = new PassThrough().on('data', (data) => {
        buffer += String(data);
    }).on('end', () => {
        buffer = buffer.trim().split('\n').map((buff) => JSON.parse(buff));

        t.deepEquals(buffer, [{
            id: 1,
            type: 'Feature',
            action: 'modify',
            version: 2,
            properties: {
                created: true
            },
            geometry: {
                type: 'Point',
                coordinates: [1, 1]
            }
        }]);
        t.end();
    });

    hecate._.revert.deltas({
        output: results,
        start: 2,
        end: 2
    }, (err) => {
        t.error(err);
    });
});

test('Clean revert of multiple deltas', (t) => {
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
                    action: 'modify'
                }]
            }
        })
        .get('/api/delta/3')
        .reply(200, {
            features: {
                type: 'FeatureCollection',
                features: [{
                    id: 2,
                    version: 3,
                    action: 'delete'
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
                    coordinates: [0.0, 0.0]
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
                    coordinates: [1.0, 1.0]
                }
            }
        }])
        .get('/api/data/feature/2/history')
        .reply(200, [{
            feat: {
                id: 2,
                type: 'Feature',
                action: 'delete',
                version: 3,
                properties: null,
                geometry: null
            }
        },{
            feat: {
                id: 2,
                type: 'Feature',
                action: 'modify',
                version: 2,
                properties: {
                    modified: true
                },
                geometry: {
                    type: 'Point',
                    coordinates: [0.0, 0.0]
                }
            }
        },{
            feat: {
                id: 2,
                type: 'Feature',
                action: 'create',
                version: 1,
                properties: {
                    created: true
                },
                geometry: {
                    type: 'Point',
                    coordinates: [1.0, 1.0]
                }
            }
        }]);

    let buffer = '';
    const results = new PassThrough().on('data', (data) => {
        buffer += String(data);
    }).on('end', () => {
        buffer = buffer.trim().split('\n').map((buff) => JSON.parse(buff));

        t.deepEquals(buffer, [{
            id: 1,
            type: 'Feature',
            action: 'modify',
            version: 2,
            properties: {
                created: true
            },
            geometry: {
                type: 'Point',
                coordinates: [1, 1]
            }
        },{
            id: 2,
            type: 'Feature',
            action: 'restore',
            version: 3,
            properties: {
                modified: true
            },
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            }
        }]);
        t.end();
    });

    hecate._.revert.deltas({
        output: results,
        start: 2,
        end: 3
    }, (err) => {
        t.error(err);
    });
});

test('Failed revert as feature exists multiple times across detlas', (t) => {
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
                    version: 1,
                    action: 'create'
                }]
            }
        })
        .get('/api/delta/3')
        .reply(200, {
            features: {
                type: 'FeatureCollection',
                features: [{
                    id: 1,
                    version: 2,
                    action: 'modify'
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
                    coordinates: [0.0, 0.0]
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
                    coordinates: [1.0, 1.0]
                }
            }
        }])
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
                    coordinates: [0.0, 0.0]
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
                    coordinates: [1.0, 1.0]
                }
            }
        }]);

    hecate._.revert.deltas({
        output: new PassThrough(),
        start: 2,
        end: 3
    }, (err) => {
        t.equals(err.message, 'Feature: 1 exists multiple times across deltas to revert. reversion not supported');
        t.end();
    });
});

test('Failed revert as feature has been edited since desired revert', (t) => {
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
                    version: 1,
                    action: 'create'
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
                    coordinates: [0.0, 0.0]
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
                    coordinates: [1.0, 1.0]
                }
            }
        }]);

    hecate._.revert.deltas({
        output: new PassThrough(),
        start: 2,
        end: 2
    }, (err) => {
        t.equals(err.message, 'Feature: 1 has been subsequenty edited. reversion not supported');
        t.end();
    });
});
