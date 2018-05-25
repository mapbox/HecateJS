'use strict';

const test = require('tape');
const path = require('path');
const fs = require('fs');

for (const lib of fs.readdirSync(path.resolve(__dirname, '../lib'))) {
  test(`${lib}: Enforce lib API`, (t) => {
    const loaded = new (require(`../lib/${lib}`))({});

    t.ok(loaded.help, 'Exposes help() function');
    t.ok(loaded.cli, 'Exposes cli() function');
    t.ok(loaded.main, 'Exposes main() function');

    t.end();
  });
}


