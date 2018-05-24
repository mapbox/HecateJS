'use strict';

const fs = require('fs');
const path = require('path');

const list = ['No schema validator'];

function getSchemaList() {
    const schemaFiles = fs.readdirSync(path.resolve(__dirname, '../srv/schemas/'));
    for (const filename in schemaFiles) {
        if (schemaFiles[filename].indexOf('.json') >= 0) list.push(schemaFiles[filename]);
    }
    return list;
}

module.exports = getSchemaList();
