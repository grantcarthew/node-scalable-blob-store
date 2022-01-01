const tap = require('tap');
const ulid = require('ulid').ulid;
const cuid = require('cuid');
const uuid = require('uuid');
const utils = require('./test-utils');
const bulkCreate = require('./bulk-create');
const blobStoreRoot = utils.genBlobStoreRoot('blob-store-bulk-create');

tap.test('scalable-blob-store bulk create 2x2 with ulid tests', async (t) => {
  t.plan(5);
  const t1 = {
    blobStoreRoot: blobStoreRoot + '-t1',
    idFunction: ulid,
    dirDepth: 2,
    dirWidth: 2,
  };
  const r1 = await bulkCreate(t1, 124);
  t.equal(r1.totalDirectories, 93, 'Total directories should be 93');
  t.equal(r1.totalFiles, 124, 'Total files should be 124');
  t.equal(r1.totalBytes, 5332, 'Total Bytes should be 5332');
  const s1 = r1.lastBlobPath.split('/').filter((x) => x);
  t.equal(s1[0].length, 26, 'idFunction keys should be 26 characters long');
  t.equal(s1.length, 3, 'mPath length should contain 3 ids');
});

tap.test('scalable-blob-store bulk create 2x8 with cuid tests', async (t) => {
  t.plan(5);
  const t2 = {
    blobStoreRoot: blobStoreRoot + '-t2',
    idFunction: cuid,
    dirDepth: 8,
    dirWidth: 2,
  };
  const r2 = await bulkCreate(t2, 8);
  t.equal(r2.totalDirectories, 12, 'Total directories should be 12');
  t.equal(r2.totalFiles, 8, 'Total files should be 8');
  t.equal(r2.totalBytes, 344, 'Total Bytes should be 344');
  const s2 = r2.lastBlobPath.split('/').filter((x) => x);
  t.equal(s2[0].length, 25, 'idFunction keys should be 25 characters long');
  t.equal(s2.length, 9, 'mPath length should contain 3 ids');
});

tap.test('scalable-blob-store bulk create 10x2 with uuid tests', async (t) => {
  t.plan(5);
  const t3 = {
    blobStoreRoot: blobStoreRoot + '-t3',
    idFunction: uuid.v4,
    dirDepth: 10,
    dirWidth: 2,
  };
  const r3 = await bulkCreate(t3, 8);
  t.equal(r3.totalDirectories, 14, 'Total directories should be 14');
  t.equal(r3.totalFiles, 8, 'Total files should be 8');
  t.equal(r3.totalBytes, 344, 'Total Bytes should be 344');
  const s3 = r3.lastBlobPath.split('/').filter((x) => x);
  t.equal(s3[0].length, 36, 'idFunction keys should be 36 characters long');
  t.equal(s3.length, 11, 'mPath length should contain 11 ids');
});
