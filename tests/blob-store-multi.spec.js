const test = require('tape')
const Promise = require('bluebird')
const testBlobStore = require('./test-blob-store')
const utils = require('./test-utils')
const blobRoot = utils.blobRoot('blob-store-multi')

const optionsA = {
  blobStoreRoot: blobRoot + '/A',
  idType: 'cuid',
  dirDepth: 5,
  dirWidth: 10
}
const optionsB = {
  blobStoreRoot: blobRoot + '/B',
  idType: 'uuid',
  dirDepth: 5,
  dirWidth: 10
}

module.exports = async function blobStoreMultiSpec () {
  test('blob-store multi tests', async function (t) {
    t.plan(23)
    try {
      const promises = []
      promises.push(testBlobStore(t, optionsA, ': A'))
      promises.push(testBlobStore(t, optionsB, ': B'))
      await Promise.all(promises)
      t.pass('blob-store multi tests completed')

      await utils.rmBlobDir(blobRoot)
    } catch (err) {
      console.error(err)
    }
  })
}
