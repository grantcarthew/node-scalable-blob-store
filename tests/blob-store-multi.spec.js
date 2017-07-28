const os = require('os')
const test = require('tape')
const Promise = require('bluebird')
const testBlobStore = require('./test-blob-store')
const utils = require('./test-utils')
const blobRootA = utils.blobRoot('blob-store-multi-A')
const blobRootB = utils.blobRoot('blob-store-multi-B')

const optionsA = {
  blobStoreRoot: blobRootA,
  idType: 'cuid',
  dirDepth: 5,
  dirWidth: 10
}
const optionsB = {
  blobStoreRoot: blobRootB,
  idType: 'uuid',
  dirDepth: 5,
  dirWidth: 10
}

module.exports = async function blobStoreMultiSpec () {
  test('blob-store multi tests', (t) => {

    t.plan(23)
    const promises = []
    promises.push(testBlobStore(t, optionsA, ': A'))
    promises.push(testBlobStore(t, optionsB, ': B'))
    return Promise.all(promises).then(() => {
      t.pass('blob-store multi tests completed')
    }).catch(err => { console.error(err) })
  })
}
