const tap = require('tap');
const blobDirBuild = require('../src/blob-dir-build');
const utils = require('./test-utils');
const blobRoot = utils.genBlobStoreRoot('blob-path-build');

const state = {
  blobStoreRoot: blobRoot,
  idFunction,
  dirDepth: 3,
  dirWidth: 1000,
};

tap.test('blob-dir-build tests', async (t) => {
  t.plan(2);
  await utils.rmBlobDir(blobRoot);
  await utils.mkBlobDir(blobRoot);
  let dir = await blobDirBuild(state);
  t.equal(dir, '/1/2/3', 'returns /1/2/3 due to simple int idFunction');
  const blobFs = await utils.buildTestFs(blobRoot);
  dir = await blobDirBuild(state);
  t.equal(dir, blobFs.latestBlobDir, 'returns latest blob dir from test directories');
  await utils.rmBlobDir(blobRoot);
});

let i = 1;
function idFunction() {
  return '' + i++;
}
