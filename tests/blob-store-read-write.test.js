const tap = require('tap');
const BlobStore = require('../src/blob-store');
const ulid = require('ulid').ulid;
const del = require('del');
const utils = require('./test-utils');
const streamToString = require('./test-streamtostring');
const crispyStream = require('crispy-stream');
const data = 'The quick brown fox jumps over the lazy dog';
const blobStoreRoot = utils.genBlobStoreRoot('blob-store-read-write');
const testOptions = {
  blobStoreRoot,
  idFunction: ulid,
};

tap.test('scalable-blob-store read/write tests', async (t) => {
  await del(blobStoreRoot, { force: true });
  const bs = new BlobStore(testOptions);
  const ws1 = await bs.createWriteStream();
  t.equal(typeof ws1.blobPath, 'string', 'Blob path should be a string');
  t.equal(typeof ws1.writeStream, 'object', 'Write stream should be an object');
  let testBlobPath = ws1.blobPath;
  const crispyReadStream = crispyStream.createReadStream(data);
  const blobPath = await new Promise((resolve, reject) => {
    ws1.writeStream.on('finish', () => {
      t.pass('Write stream should complete');
      resolve(ws1.blobPath);
    });
    ws1.writeStream.on('error', reject);
    crispyReadStream.pipe(ws1.writeStream);
  });
  const rs1 = await bs.createReadStream(blobPath);
  const read = await streamToString(rs1);
  t.equal(read, data, 'Stream to string blob contents should be correct');
  const exists = await bs.exists(testBlobPath);
  t.equal(exists, true, 'Exist test should be true');
  const fh = await bs.open(blobPath);
  const fhData = await fh.readFile({ encoding: 'utf8' });
  t.equal(fhData, utils.data, 'Read file blob contents should be correct');
  const stat = await bs.stat(testBlobPath);
  t.equal(stat.size, 43, 'Blob stat size should be 43 Bytes');
  const remove = await bs.remove(testBlobPath);
  t.equal(remove, undefined, 'Blob removal should return undefined');
  const notExists = await bs.exists(testBlobPath);
  t.equal(notExists, false, 'Blob existance test should return false for invalid blob path');
  const rs2 = await bs.createReadStream('/invalidread');
  rs2.on('error', (err) => {
    t.equal(err.code, 'ENOENT', 'Reading an invalid blob should throw');
  });
  try {
    await bs.stat('/invalidstat');
  } catch (err) {
    t.equal(err.code, 'ENOENT', 'Stat for an invalid blob should throw');
  }
  const invalidRemove = await bs.remove('/invalidremove');
  t.equal(invalidRemove, undefined, 'Remove invalid blob should return undefined');
});
