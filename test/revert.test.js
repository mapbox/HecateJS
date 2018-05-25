'use strict';

const test = require('tape').test;
const revert = new(require('../lib/revert'))({});
const fs = require('fs');
const path = require('path');

let historyList = fs.readFileSync(path.resolve(__dirname, './fixtures/historyList.json'), 'utf8').split('\n');
historyList = historyList.map((feature) => { return JSON.parse(feature); });

// Test revertFeature() when history list size > 3

test('Assert fails due to missing parameters', (t) => {
  t.throws(() => { revert.revertFeature(null, 'feature'); }, /The historyList cannot be empty./, 'The historyList cannot be empty.');
  t.throws(() => { revert.revertFeature('historyList', null); }, /The feature cannot be empty./, 'The feature cannot be empty.');
  t.end();
});

test('Assert revert when action = create in long history list', (t) => {
  const feature = { 'action': 'create', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature' };
  const expectedRevertedFeature = { action: 'delete', geometry: null, id: 1, properties: null, type: 'Feature', version: 6 };
  const revertedFeature = revert.revertFeature(historyList, feature);

  t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to delete is the right one');
  t.end();
});

test('Assert revert when action = delete in long history list', (t) => {
  const feature = { 'action': 'delete', 'geometry': null, 'id': 1, 'properties': null, 'type': 'Feature', 'version': 3 };
  const expectedRevertedFeature = { 'action': 'restore', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 6 };
  const revertedFeature = revert.revertFeature(historyList, feature);

  t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to restore is the right one');
  t.end();
});

test('Assert revert when action = modify in long history list', (t) => {
  const feature = { 'action': 'modify', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 2 };
  const expectedRevertedFeature = { 'action': 'modify', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'xyz' }, 'type': 'Feature', 'version': 6 };
  const revertedFeature = revert.revertFeature(historyList, feature);

  t.deepEquals(JSON.stringify(revertedFeature), JSON.stringify(expectedRevertedFeature), 'feature to modify is the right one');
  t.end();
});

test('Assert revert when action = restore in long history list', (t) => {
  const feature = { 'action': 'restore', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 4 };
  const expectedRevertedFeature = { 'action': 'delete', 'geometry': null, 'id': 1, 'properties': null, 'type': 'Feature', 'version': 6 };
  const revertedFeature = revert.revertFeature(historyList, feature);

  t.deepEquals(JSON.stringify(revertedFeature), JSON.stringify(expectedRevertedFeature), 'feature to delete is the right one');
  t.end();
});

// Test revertFeature() when history list size = 3
let threeHistory = fs.readFileSync(path.resolve(__dirname, './fixtures/threeHistory.json'), 'utf8').split('\n');
threeHistory = threeHistory.map((feature) => { return JSON.parse(feature); });

test('Assert revert when action = create when history list size = 3', (t) => {
  const feature = { 'action': 'create', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature' };
  const expectedRevertedFeature = { action: 'delete', geometry: null, id: 1, properties: null, type: 'Feature', version: 3 };
  const revertedFeature = revert.revertFeature(threeHistory, feature);

  t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to delete is the right one');
  t.end();
});

test('Assert revert when action = delete when history list size = 3', (t) => {
  const feature = { 'action': 'delete', 'geometry': null, 'id': 1, 'properties': null, 'type': 'Feature', 'version': 1 };
  const expectedRevertedFeature = { 'action': 'restore', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 3 };
  const revertedFeature = revert.revertFeature(threeHistory, feature);

  t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to restore is the right one');
  t.end();
});

test('Assert revert when action = restore when history list size = 3', (t) => {
  const feature = { 'action': 'restore', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 2 };
  const expectedRevertedFeature = { 'action': 'delete', 'geometry': null, 'id': 1, 'properties': null, 'type': 'Feature', 'version': 3 };
  const revertedFeature = revert.revertFeature(threeHistory, feature);

  t.deepEquals(JSON.stringify(revertedFeature), JSON.stringify(expectedRevertedFeature), 'feature to delete is the right one');
  t.end();
});

// Test revertFeature() when history list size = 2

let twoModifyHistory = fs.readFileSync(path.resolve(__dirname, './fixtures/twoModifyHistory.json'), 'utf8').split('\n');
twoModifyHistory = twoModifyHistory.map((feature) => { return JSON.parse(feature); });

test('Assert revert when action = create when history list size = 2', (t) => {
  const feature = { 'action': 'create', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature' };
  const expectedRevertedFeature = { action: 'delete', geometry: null, id: 1, properties: null, type: 'Feature', version: 2 };
  const revertedFeature = revert.revertFeature(twoModifyHistory, feature);

  t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to delete is the right one');
  t.end();
});

test('Assert revert when action = modify when history list size = 2', (t) => {
  const feature = { 'action': 'modify', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'xyz' }, 'type': 'Feature', 'version': 1 };
  const expectedRevertedFeature = { 'action': 'modify', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 2 };
  const revertedFeature = revert.revertFeature(twoModifyHistory, feature);

  t.deepEquals(JSON.stringify(revertedFeature), JSON.stringify(expectedRevertedFeature), 'feature to modify is the right one');
  t.end();
});

let twoDeleteHistory = fs.readFileSync(path.resolve(__dirname, './fixtures/twoDeleteHistory.json'), 'utf8').split('\n');
twoDeleteHistory = twoDeleteHistory.map((feature) => { return JSON.parse(feature); });

test('Assert revert when action = create when history list size = 2', (t) => {
  const feature = { 'action': 'create', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature' };
  const expectedRevertedFeature = { action: 'delete', geometry: null, id: 1, properties: null, type: 'Feature', version: 2 };
  const revertedFeature = revert.revertFeature(twoDeleteHistory, feature);

  t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to delete is the right one');
  t.end();
});

test('Assert revert when action = delete when history list size = 2', (t) => {
  const feature = { 'action': 'delete', 'geometry': null, 'id': 1, 'properties': null, 'type': 'Feature', 'version': 1 };
  const expectedRevertedFeature = { 'action': 'restore', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 2 };
  const revertedFeature = revert.revertFeature(twoDeleteHistory, feature);

  t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to restore is the right one');
  t.end();
});

// Test revertFeature() when history list size = 1
test('Assert revert when action = create when history list size = 1', (t) => {
  const oneHistory = [{ 'feat': { 'action': 'create', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature' }, 'id': 24, 'uid': 1, 'username': 'sm' }];

  const feature = { 'action': 'create', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature' };
  const expectedRevertedFeature = { 'action': 'delete', 'geometry': null, 'id': 1, 'properties': null, 'type': 'Feature', 'version': 1 };
  const revertedFeature = revert.revertFeature(oneHistory, feature);

  t.deepEquals(revertedFeature, expectedRevertedFeature, 'feature to delete is the right one');
  t.end();
});

test('Assert fail when feature to revert is not found', (t) => {
  const oneHistory = [{ 'feat': { 'action': 'create', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature' }, 'id': 24, 'uid': 1, 'username': 'sm' }];

  const feature = { 'action': 'create', 'geometry': { 'coordinates': [120, 40], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature' };
  const expectedRevertedFeature = { 'action': 'delete', 'geometry': null, 'id': 1, 'properties': null, 'type': 'Feature', 'version': 1 };

  t.throws(() => { revert.revertFeature(oneHistory, feature); }, /Feature to revert was not found in the history list./, 'Feature to revert was not found in the history list');
  t.end();
});


// Test getRevertToFeature()
test('Assert fail due to missing parameter in getRevertToFeature', (t) => {
  t.throws(() => { revert.getRevertToFeature(null, 'feature', () => {}); }, /The historyList cannot be empty./, 'The historyList cannot be empty.');
  t.throws(() => { revert.getRevertToFeature([{ 'feat': 'fake' }], null, () => {}); }, /The feature cannot be empty./, 'The feature cannot be empty.');
  t.end();
});

test('Assert getting feature to revert to', (t) => {
  const featureModified = { 'action': 'modify', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 2 };
  const expectForModified = { 'action': 'modify', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'xyz' }, 'type': 'Feature', 'version': 1 };

  const featureDeleted = { 'action': 'delete', 'geometry': null, 'id': 1, 'properties': null, 'type': 'Feature', 'version': 3 };
  const expectedForDeleted = { 'action': 'modify', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 2 };

  revert.getRevertToFeature(historyList, featureModified, (revertToFeature) => {
    t.deepEquals(revertToFeature, expectForModified, 'got feature to revert to');
  });
  revert.getRevertToFeature(historyList, featureDeleted, (revertToFeature) => {
    t.deepEquals(revertToFeature, expectedForDeleted, 'got feature to revert to');
  });
  t.end();
});

// Test hasFeatureChanged()
test('Assert fail due to missing parameters in hasFeatureChanged', (t) => {
  t.throws(() => { revert.hasFeatureChanged(null, 'feature'); }, /The historyList cannot be undefined./, 'The historyList cannot be undefined.');
  t.throws(() => { revert.hasFeatureChanged([], 'feature'); }, /The historyList cannot be empty./, 'The historyList cannot be empty.');
  t.throws(() => { revert.hasFeatureChanged([{ 'feat': 'fake' }], null); }, /The feature cannot be empty./, 'The feature cannot be empty.');
  t.end();
});

test('Evaluate if feature has changed in long list', (t) => {
  const featureChanged = { 'action': 'restore', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 4 };
  const featureNoChanged = { 'action': 'modify', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 2 };

  t.deepEquals(revert.hasFeatureChanged(historyList, featureChanged), true, 'feature has changed');
  t.deepEquals(revert.hasFeatureChanged(historyList, featureNoChanged), false, 'feature has not changed');
  t.end();
});

test('Evaluate if feature has changed in long list when history list size = 3', (t) => {
  const featureNoChanged = { 'action': 'delete', 'geometry': null, 'id': 1, 'properties': null, 'type': 'Feature', 'version': 1 };
  const currentFeature = { 'action': 'restore', 'geometry': { 'coordinates': [13, 52], 'type': 'Point' }, 'id': 1, 'properties': { 'address': 'abc' }, 'type': 'Feature', 'version': 2 };

  t.deepEquals(revert.hasFeatureChanged(threeHistory, featureNoChanged), false, 'feature has not changed');
  t.deepEquals(revert.hasFeatureChanged(threeHistory, currentFeature), true, 'feature has changed');

  t.end();
});

// validateArguments()
test('Assert fails due to missing parameter to revert delta', (t) => {
  t.throws(() => { revert.validateArguments({ port: '7777', username: 'user', password: 'psw', deltaId: 7 }); }, /url is required/, 'url is required');
  t.throws(() => { revert.validateArguments({ url: 'url', username: 'user', password: 'psw', deltaId: 7 }); }, /port is required/, 'port is required');
  t.throws(() => { revert.validateArguments({ url: 'url', port: '7777', password: 'psw', deltaId: 7 }); }, /username is required/, 'username is required');
  t.throws(() => { revert.validateArguments({ url: 'url', port: '7777', username: 'user', deltaId: 7 }); }, /password is required/, 'password is required');
  t.throws(() => { revert.validateArguments({ url: 'url', port: '7777', username: 'user', password: 'psw' }); }, /deltaId is required/, 'deltaId is required');
  t.end();
});
