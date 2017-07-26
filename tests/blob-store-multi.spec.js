const os = require('os')
const test = require('tape')
const Promise = require('bluebird')
const testBlobStore = require('./test-blob-store')

const optionsA = {
  blobStoreRoot: '/tmp/blobsA',
  idType: 'cuid',
  dirDepth: 5,
  dirWidth: 10
}
const optionsB = {
  blobStoreRoot: '/tmp/blobsB',
  idType: 'uuid',
  dirDepth: 5,
  dirWidth: 10
}

module.exports = async function blobStoreMultiSpec () {
  test('blob-store multi tests', (t) => {

    t.plan(23)
    const promises = []
    promises.push(testBlobStore(t, optionsA))
    promises.push(testBlobStore(t, optionsB))
    return Promise.all(promises).then(() => {
      t.pass('blob-store multi tests completed')
    })
  })
}
