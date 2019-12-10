const test = require('tape');
const revert = require('../util/revert');

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

    t.end();
});
