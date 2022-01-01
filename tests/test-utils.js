const os = require('os');
const fsp = require('fs').promises;
const mkdir = fsp.mkdir;
const writeFile = fsp.writeFile;
const del = require('del');
const path = require('path');
const ulid = require('ulid').ulid;
const cuid = require('cuid');
const uuid = require('uuid');

const data = 'The quick brown fox jumps over the lazy dog';
module.exports.data = data;

module.exports.mkBlobDir = mkBlobDir;
async function mkBlobDir(blobRoot, ...dirs) {
  const fullPath = path.join(blobRoot, ...dirs);
  return mkdir(fullPath, { recursive: true });
}

module.exports.rmBlobDir = rmBlobDir;
async function rmBlobDir(blobRoot, ...parts) {
  const fullPath = path.join(blobRoot, ...parts);
  return fullPath.startsWith(os.tmpdir()) && del(fullPath, { force: true });
}

module.exports.genBlobStoreRoot = genBlobStoreRoot;
function genBlobStoreRoot(name) {
  let rootPath = path.join(os.tmpdir(), 'blobs', name);
  return rootPath;
}

module.exports.mkBlobFile = mkBlobFile;
async function mkBlobFile(blobRoot, ...pathPart) {
  pathPart.length > 1 && (await mkBlobDir(blobRoot, ...pathPart.slice(0, pathPart.length - 1)));
  let fullPath = path.join(blobRoot, ...pathPart);
  return writeFile(fullPath, data);
}

module.exports.delay = delay;
function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

module.exports.generateUlids = generateUlids;
function generateUlids(total) {
  const ulids = [];
  for (let i = 0; i < total; i++) {
    ulids.push(ulid());
  }
  return ulids;
}
module.exports.generateCuids = generateCuids;
function generateCuids(total) {
  const cuids = [];
  for (let i = 0; i < total; i++) {
    cuids.push(cuid());
  }
  return cuids;
}

module.exports.generateUuids = generateUuids;
function generateUuids(total) {
  const uuids = [];
  for (let i = 0; i < total; i++) {
    uuids.push(uuid.v4());
  }
  return uuids;
}

module.exports.buildTestFs = buildTestFs;
async function buildTestFs(blobStoreRoot) {
  try {
    await del(blobStoreRoot, { force: true });
    await mkBlobFile(blobStoreRoot, '01a', '01b', '01c', '01d');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '02a', '02b', '02c', '02d');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '03a', '03b', '03c', '03d');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '04a');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '05a');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '06a');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '07a', '07b', '07c', '07d');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '08a', '08b', '08c', '08d');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '09a', '09b', '09c', '09d');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '10a');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '11a');
    await delay(200);
    await mkBlobFile(blobStoreRoot, '12a');
  } catch (err) {
    console.log('Error in buildTestFs ');
    console.error(err);
  }
  return {
    firstBlobDir: '/01a/01b/01c',
    firstBlobPath: '/01a/01b/01c/01d',
    latestBlobDir: '/09a/09b/09c',
    latestBlobPath: '/09a/09b/09c/09d',
  };
}
