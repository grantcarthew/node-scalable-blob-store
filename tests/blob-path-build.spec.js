const test = require('tape')
const blobPathBuild = require('../dist/blob-path-build')
const idValidator = require('../dist/id-validator')
const idGenerator = require('../dist/id-generator')
const utils = require('./test-utils')
const blobRoot = utils.blobRoot('blob-path-build')

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

    } catch (err) {
      console.error(err)  
    }
  })
}
