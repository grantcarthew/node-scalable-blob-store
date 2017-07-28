const test = require('tape')
const testBlobStore = require('./test-blob-store')
const utils = require('./test-utils')
const blobRoot = utils.blobRoot('blob-store-api-promise')

const options = {
  blobStoreRoot: blobRoot,
  idType: 'cuid',
  dirDepth: 5,
  dirWidth: 10
}

module.exports = async function blobStoreApiPromiseSpec (opt) {
  test('blob-store api promise tests', async function (t) {
    t.plan(12)
    try {
      await testBlobStore(t, options)
      await utils.rmBlobDir(blobRoot)
    } catch (err) {
      console.error(err)
    }
    t.pass('blob-store api promise tests completed')
  })
}
