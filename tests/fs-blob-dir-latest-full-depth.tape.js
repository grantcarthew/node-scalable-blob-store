const test = require('tape')
const fsBlobDirLatestFullDepth = require('../dist/fs-blob-dir-latest-full-depth')
const idValidator = require('../dist/id-validator')
const idGenerator = require('../dist/id-generator')
const utils = require('./test-utils')
const blobRoot = utils.blobRoot('fs-blob-dir-latest-full-depth')

const stateCuid = {
  blobStoreRoot: blobRoot,
  idType: 'cuid',
  dirDepth: 3,
  dirWidth: 1000,
  validateId: idValidator('cuid'),
  newId: idGenerator('cuid')
}
const stateUuid = {
  blobStoreRoot: blobRoot,
  idType: 'uuid',
  dirDepth: 3,
  dirWidth: 1000,
  validateId: idValidator('uuid'),
  newId: idGenerator('uuid')
}

module.exports = async function fsBlobDirLatestFullDepthSpec () {
  test('fs-blob-dir-latest-full-depth tests', async function (t) {
    try {
      const blobFs = await utils.buildTestFs(blobRoot)

      t.plan(4)
      let dir
      dir = await fsBlobDirLatestFullDepth(stateCuid)
      t.equal(dir, blobFs.newestCuid, 'Return newest CUID directory')
      dir = await fsBlobDirLatestFullDepth(stateUuid)
      t.equal(dir, blobFs.newestUuid, 'Return newest UUID directory')
      stateCuid.blobStoreRoot = '/emptyCuidBlobStoreRoot'
      dir = await fsBlobDirLatestFullDepth(stateCuid)
      t.equal(dir.split('/').length - 1, 3, 'Return new CUID directory')
      stateUuid.blobStoreRoot = '/emptyUuidBlobStoreRoot'
      dir = await fsBlobDirLatestFullDepth(stateCuid)
      t.equal(dir.split('/').length - 1, 3, 'Return new UUID directory')

      await utils.rmBlobDir(blobRoot)
    } catch (err) {
      console.error(err)
    }
  })
}
