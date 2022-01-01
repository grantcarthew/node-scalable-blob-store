const tap = require('tap');
const fsBlobDirItemList = require('../src/fs-blob-dir-item-list');
const utils = require('./test-utils');
const blobRoot = utils.genBlobStoreRoot('fs-modules');

tap.beforeEach(async () => {
  await utils.buildTestFs(blobRoot);
});

tap.test('fs-blob-dir-list tests', async (t) => {
  t.plan(8);
  let items = await fsBlobDirItemList(blobRoot, '/');
  t.ok(Array.isArray(items), 'Item list should be an array');
  t.equal(items.length, 6, 'Item list should contain 6 items');
  items = await fsBlobDirItemList(blobRoot, 'does-not-exist');
  t.ok(Array.isArray(items), 'Item list for invalid path should be an array');
  t.equal(items.length, 0, 'Item list for invalid path should contain 0 items');
  items = await fsBlobDirItemList(blobRoot, '/', 'isDirectory');
  t.ok(Array.isArray(items), 'Item list for isDirectory should be an array');
  t.equal(items.length, 6, 'Item list for isDirectory should contain 6 items');
  items = await fsBlobDirItemList(blobRoot, 'does-not-exist', 'isDirectory');
  t.ok(Array.isArray(items), 'Item list for isDirectory on invalid path should be an array');
  t.equal(items.length, 0, 'Item list for isDirectory on invalid path should contain 0 items');
});
