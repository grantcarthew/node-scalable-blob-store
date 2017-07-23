const os = require('os')
const test = require('tape')
const testBlobStore = require('./test-blob-store')

const options = {
  blobStoreRoot: os.tmpdir() + '/blobs',
  idType: 'cuid',
  dirDepth: 5,
  dirWidth: 10
}

module.exports = async function blobStoreApiPromiseSpec (opt) {
  test('blob-store api promise tests', async function (t) {
    t.plan(12)
    await testBlobStore(t, options)
    t.pass('blob-store api promise tests completed')
  })
}
