const test = require('tape')
const ulid = require('ulid').ulid
const cuid = require('cuid')
const uuid = require('uuid')
const blobPathBuild = require('../src/blob-path-build')
const utils = require('./test-utils')
const blobRoot = utils.blobRoot('blob-path-build')

const stateUlid = {
  blobStoreRoot: blobRoot,
  idFunction: ulid,
  dirDepth: 3,
  dirWidth: 1000
}
const stateCuid = {
  blobStoreRoot: blobRoot,
  idFunction: cuid,
  dirDepth: 3,
  dirWidth: 1000
}
const stateUuid = {
  blobStoreRoot: blobRoot,
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 1000
}

module.exports = async function blobPathBuildSpec () {
  test('blob-path-build tests', async function (t) {
    try {
      const blobFs = await utils.buildTestFs(blobRoot)

      t.plan(5)
      let dir
      dir = await blobPathBuild(stateCuid)
      t.ok(dir.startsWith(blobFs.newestCuid), 'Return directory that starts with current CUID directory')
      t.equal(dir.split('/').length - 1, 3, 'Return directory that is three directories deep')
      dir = await blobPathBuild(stateUuid)
      t.ok(dir.startsWith(blobFs.newestUuid), 'Return directory that starts with current UUID directory')
      t.equal(dir.split('/').length - 1, 3, 'Return directory that is three directories deep')
      stateCuid.blobStoreRoot = '/emptyCuidBlobStoreRoot'
      dir = await blobPathBuild(stateCuid)
      t.equal(dir.split('/').length - 1, 3, 'Return new directory that is three directories deep')

      await utils.rmBlobDir(blobRoot)
    } catch (err) {
      console.error(err)
    }
  })
}
