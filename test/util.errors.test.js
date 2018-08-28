'use strict';

const errors = require('../util/errors');
const test = require('tape').test;


test('Assert HTTPError with all parameters works as expected', (t) => {
    const res = {
        body: 'This is the body',
        statusCode: 503
    };

    const httpError = new errors.HTTPError('This is an error', res);

    t.ok(httpError instanceof Error, 'HTTPError is instance of Error');
    t.equal(httpError.message, 'This is an error', 'HTTPError has the correct message');
    t.equal(httpError.status, 503, 'HTTPError has the correct status code');
    t.equal(httpError.name, 'HTTPError', 'HTTPError has the name "HTTPError"');
    t.end();
});

test('Assert HTTPError with missing res parameter works as expected', (t) => {
    const httpError = new errors.HTTPError('This is an error');
    t.equal(httpError.status, null);
    t.end();
});

