const tap = require('tap');
const fs = require('fs');
const ulid = require('ulid').ulid;
const utils = require('./test-utils');
const parser = require('../src/options-parser');
const blobRoot = utils.genBlobStoreRoot('options-parser');
const options = {};
const optsCuidDefaults = {
  blobStoreRoot: blobRoot,
  idFunction: ulid,
  dirDepth: 3,
  dirWidth: 1000,
};

tap.test('options-parser tests', async (t) => {
  t.plan(10);
  t.throws(() => parser(), /options object required/, 'Null should throw');
  t.throws(() => parser('string'), /options object required/, 'String should throw');
  t.throws(() => parser(options), /blobStoreRoot directory option is required/, 'Empty object should throw');
  options.blobStoreRoot = blobRoot;
  t.throws(() => parser(options), /idFunction option is required/, 'Missing idFunction should throw');
  options.idFunction = 'invalid';
  t.throws(() => parser(options), /idFunction option is must be a function/, 'Invalid idFunction should throw');
  options.idFunction = () => 123;
  t.throws(() => parser(options), /must generate a string/, 'Invalid idFunction return type should throw');
  options.idFunction = ulid;
  options.dirDepth = 0;
  t.throws(() => parser(options), /dirDepth option must be between 1 and 10/, 'Invalid dirDepth of 0 should throw');
  options.dirDepth = 11;
  t.throws(() => parser(options), /dirDepth option must be between 1 and 10/, 'Invalid dirDepth of 11 should throw');
  delete options.dirDepth;
  t.same(parser(options), optsCuidDefaults, 'Parser should return valid objects');
  t.ok(fs.existsSync(options.blobStoreRoot), 'blobStoreRoot directory should exist');
});
