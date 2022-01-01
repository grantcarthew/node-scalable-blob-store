const tap = require('tap');
const ulid = require('ulid').ulid;
const cuid = require('cuid');
const utils = require('./test-utils');
const bulkCreate = require('./bulk-create');
const blobRoot = utils.genBlobStoreRoot('blob-store-multi');

const optionsA = {
  blobStoreRoot: blobRoot + '/A',
  idFunction: ulid,
  dirDepth: 5,
  dirWidth: 10,
};
const optionsB = {
  blobStoreRoot: blobRoot + '/B',
  idFunction: cuid,
  dirDepth: 5,
  dirWidth: 10,
};

tap.test('blob-store multi tests', async (t) => {
  t.plan(4);
  const promises = [];
  promises.push(bulkCreate(optionsA, 1200));
  promises.push(bulkCreate(optionsB, 1100));
  const result = await Promise.all(promises);
  t.equal(result[0].totalDirectories, 136, 'Store 1 total directories should be 136');
  t.equal(result[0].totalFiles, 1200, 'Store 1 total files should be 1200');
  t.equal(result[1].totalDirectories, 125, 'Store 2 total directories should be 125');
  t.equal(result[1].totalFiles, 1100, 'Store 2 total files should be 1100');
  await utils.rmBlobDir(blobRoot);
});
