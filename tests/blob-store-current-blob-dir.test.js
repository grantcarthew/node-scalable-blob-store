const tap = require('tap');
const BlobStore = require('../src/blob-store');
const del = require('del');
const ulid = require('ulid').ulid;
const utils = require('./test-utils');
const blobStoreRoot = utils.genBlobStoreRoot('blob-store-current-blob-dir');
const testOptions = {
  blobStoreRoot,
  idFunction: ulid,
  dirWidth: 3,
};
let dirs = {};

tap.beforeEach(async () => {
  await del(blobStoreRoot, { force: true });
  dirs = await utils.buildTestFs(blobStoreRoot);
});

tap.test('scalable-blob-store currentBlobDir tests', async (t) => {
  t.plan(4);
  const bs = new BlobStore(testOptions);
  let dir = await bs.getCurrentBlobDir();
  t.equal(dir, dirs.latestBlobDir, 'getCurrentBlobDir should return latest dir');
  await bs.setCurrentBlobDir(dirs.firstBlobDir);
  dir = await bs.getCurrentBlobDir();
  t.equal(dir, dirs.firstBlobDir, 'After set should return first blob dir');
  await bs.write(utils.data);
  dir = await bs.getCurrentBlobDir();
  t.equal(dir, dirs.firstBlobDir, 'After write should return first blob dir');
  await bs.write(utils.data);
  dir = await bs.getCurrentBlobDir();
  t.equal(dir, dirs.latestBlobDir, 'After second write should return latest dir');
});
