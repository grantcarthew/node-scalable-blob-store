const test = require('tape')
const mock = require('mock-fs')
const Promise = require('bluebird')
const testBlobStore = require('./test-blob-store')

const options = {
  blobStoreRoot: '/tmp/blobs',
  idType: 'cuid',
  dirDepth: 5,
  dirWidth: 10
}

module.exports = async function blobStoreApiPromiseSpec (opt) {
  test('blob-store api promise tests', async function (t) {
    console.log('mocking')
    mock({'tmp/blobs':{}})

    t.plan(12)
    await testBlobStore(t, options)
    t.pass('blob-store api promise tests completed')

    mock.restore()
  })
}
