'use strict';

const Hecate = require('../cli.js');

const fs = require('fs');
const path = require('path');
const test = require('tape');
const nock = require('nock');

test('Basic Import Test', (t) => {
    const hecate = new Hecate({
        url: 'http://localhost:7777'
    });

    nock('http://localhost:7777')
        .get('/api').reply(200, {
            constraints: {
                request: {
                    max_size: 20971520
                }
            },
            version: "0.82.1"
        })
        .get('/api/schema').reply(200,
            JSON.parse(fs.readFileSync(path.resolve(__dirname, './fixtures/valid-geojson.schema')))
        );

    hecate._.import.multi({
        input: fs.createReadStream(path.resolve(__dirname, './fixtures/valid-geojson.json')),
        message: 'Test Import',
        dryrun: true
    }, (err) => {
        t.error(err);
        t.end();
    });
});

test('Restore Nock', (t) => {
    nock.cleanAll();
    t.end();
});
