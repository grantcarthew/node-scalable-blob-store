const tap = require('tap');
const BlobStore = require('../src/blob-store');
const fs = require('fs');
const del = require('del');
const ulid = require('ulid').ulid;
const utils = require('./test-utils');
const streamToString = require('./test-streamtostring');
const blobStoreRoot = utils.genBlobStoreRoot('blob-store');
const tmpBlobFile = '/data';
const testOptions = {
  blobStoreRoot,
  idFunction: ulid,
};

tap.beforeEach(async () => {
  await del(blobStoreRoot, { force: true });
  await fs.promises.mkdir(blobStoreRoot, { resursive: true });
  await fs.writeFileSync(blobStoreRoot + tmpBlobFile, utils.data);
});

tap.test('basic constructor test', async (t) => {
  t.plan(5);
  const options = {};
  t.throws(() => new BlobStore(), /options object required/, 'Null options should throw');
  t.throws(() => new BlobStore(options), /directory option is required/, 'Invalid options should throw');
  options.blobStoreRoot = blobStoreRoot;
  t.throws(() => new BlobStore(options), /idFunction option is required/, 'Incomplete options should throw');
  options.idFunction = ulid;
  t.ok(new BlobStore(options) instanceof BlobStore, 'Valid options creates a BlobStore object');
  t.ok(fs.existsSync(blobStoreRoot), 'blobStoreRoot directory should exist');
});

tap.test('blobStore properties test', (t) => {
  t.plan(4);
  const bs = new BlobStore(testOptions);
  t.equal(bs.blobStoreRoot, testOptions.blobStoreRoot, 'blobStoreRoot and options root should be equal');
  t.equal(bs.idFunction, testOptions.idFunction, 'idFunction and options idFunction should be equal');
  t.equal(bs.dirWidth, 1000, 'Blob store dirWidth should be 1000');
  t.equal(bs.dirDepth, 3, 'Blob store dirDepth should be 3');
});

tap.test('createWriteStream test', async (t) => {
  t.plan(3);
  const bs = new BlobStore(testOptions);
  const ws = await bs.createWriteStream();
  t.equal(typeof ws.blobPath, 'string', 'writeStream blobPath should be a string');
  t.equal(typeof ws.writeStream, 'object', 'writeStream should be an object');
  t.equal(typeof bs.createWriteStream(), 'object', 'createWriteStream should return an object');
});

tap.test('write test', async (t) => {
  t.plan(2);
  const bs = new BlobStore(testOptions);
  const blobPath = await bs.write(utils.data);
  t.equal(typeof blobPath, 'string', 'Returned blobPath should be a string');
  const data = await bs.read(blobPath);
  t.equal(data, utils.data, 'Blob data should be correct');
});

tap.test('append test', async (t) => {
  t.plan(1);
  const bs = new BlobStore(testOptions);
  const blobPath = await bs.write(utils.data);
  await bs.append(blobPath, utils.data);
  const data = await bs.read(blobPath);
  t.equal(data, utils.data + utils.data, 'Appended blob data should be correct');
});

tap.test('copy test', async (t) => {
  t.plan(1);
  const bs = new BlobStore(testOptions);
  const blobPath = await bs.write(utils.data);
  const dstBlobPath = await bs.copy(blobPath);
  const data = await bs.read(dstBlobPath);
  t.equal(data, utils.data, 'Copied blob data should be correct');
});

tap.test('createReadStream test', async (t) => {
  t.plan(1);
  const bs = new BlobStore(testOptions);
  const rs = await bs.createReadStream(tmpBlobFile);
  const data = await streamToString(rs);
  t.equal(data, utils.data, 'readStream should read blob data');
});

tap.test('read test', async (t) => {
  t.plan(1);
  const bs = new BlobStore(testOptions);
  const data = await bs.read(tmpBlobFile);
  t.equal(data, utils.data, 'read should read blob data');
});

tap.test('realPath test', async (t) => {
  t.plan(1);
  const bs = new BlobStore(testOptions);
  const realPath = await bs.realPath(tmpBlobFile);
  t.equal(realPath, blobStoreRoot + tmpBlobFile, 'realPath should return full blob path');
});

tap.test('exists test', async (t) => {
  t.plan(2);
  const bs = new BlobStore(testOptions);
  let result = await bs.exists(tmpBlobFile);
  t.ok(result, 'Valid blobPath exist should be true');
  result = await bs.exists('notavalidfilenameorpath');
  t.notOk(result, 'Invalid blobPath exist should be false');
});

tap.test('remove test', async (t) => {
  t.plan(3);
  const bs = new BlobStore(testOptions);
  const blobPath = await bs.write(utils.data);
  let result = await bs.exists(blobPath);
  t.ok(result, 'Blob should exist before removal');
  result = await bs.remove(blobPath);
  t.ok(typeof result === 'undefined', 'Blob removal should return undefined');
  result = await bs.exists(blobPath);
  t.notOk(result, 'Blob should not exist after removal');
});

tap.test('stat test', async (t) => {
  t.plan(2);
  const bs = new BlobStore(testOptions);
  let result = await bs.stat(tmpBlobFile);
  t.equal(typeof result.birthtime, 'object', 'Blob stat birthtime should be an object');
  t.equal(Reflect.ownKeys(result).length, 18, 'Stat object should have 18 keys');
});
