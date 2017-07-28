const os = require('os')
const test = require('tape')
const utils = require('./test-utils')
const testBlobBulkCreate = require('./test-blob-bulk-create')
const blobRoot = utils.blobRoot('blob-store-bulk')
const optionsCuid = {
  blobStoreRoot: blobRoot + '/cuidBlobs',
  idType: 'cuid',
  dirDepth: 5,
  dirWidth: 10
}
const optionsUuid = {
  blobStoreRoot: blobRoot + '/uuidBlobs',
  idType: 'uuid',
  dirDepth: 5,
  dirWidth: 10
}

module.exports = async function blobStoreBulkCreate () {
  test('blob-store bulk create tests', async function (t) {
    t.plan(6)
    try {
      const resultsCuid = await testBlobBulkCreate(optionsCuid, 505)
      const resultsUuid = await testBlobBulkCreate(optionsUuid, 505)
      t.equal(resultsCuid.totalDirectories, 55, 'Correct total number of CUID directories')
      t.equal(resultsCuid.totalFiles, 505, 'Correct total number of CUID files')
      t.equal(resultsCuid.totalBytes, 22220, 'Correct total number of bytes')
      t.equal(resultsUuid.totalDirectories, 55, 'Correct total number of UUID directories')
      t.equal(resultsUuid.totalFiles, 505, 'Correct total number of UUID files')
      t.equal(resultsUuid.totalBytes, 22220, 'Correct total number of bytes')

      await utils.rmBlobDir(blobRoot)
    } catch (err) {
      console.error(err)
    }
  })
}
