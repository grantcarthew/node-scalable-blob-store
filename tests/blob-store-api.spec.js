const mock = require('mock-fs')
const test = require('tape')
const sbsFactory = require('../src/blob-store.js')
const crispyStream = require('crispy-stream')
const data = 'The quick brown fox jumped over the lazy dog'
const readStream = crispyStream.createReadStream(data)

const options = {
  blobStoreRoot: '/tmp/blobs',
  idType: 'cuid',
  dirDepth: 5,
  dirWidth: 10
}
const blobStore = sbsFactory.create(options)
var testBlobPath = ''

function streamToString (stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })
    stream.on('end', () => {
      resolve(chunks.join(''))
    })
  })
}

test('blob-store api tests', t => {
  mock()

  t.plan(8)
  return blobStore.createWriteStream()
  .then(result => {
    t.ok(result.blobPath, 'createWriteStream blob path created')
    t.ok(result.writeStream, 'createWriteStream writeStream created')
    testBlobPath = result.blobPath
    return new Promise((resolve, reject) => {
      result.writeStream.on('finish', () => {
        t.pass('blob file write succeeded')
        resolve(result.blobPath)
      })
      result.writeStream.on('error', reject)
      readStream.pipe(result.writeStream)
    })
  }).then(blobPath => {
    return blobStore.createReadStream(blobPath)
  }).then(readStream => {
    return streamToString(readStream)
  }).then(result => {
    t.equal(result, data, 'blob file read succeeded')
  }).then(() => {
    return blobStore.exists(testBlobPath)
  }).then(result => {
    t.ok(result, 'blob file exists succeeded')
  }).then(() => {
    return blobStore.stat(testBlobPath)
  }).then(stat => {
    t.equal(stat.size, 44, 'blob file stat succeeded')
  }).then(() => {
    return blobStore.remove(testBlobPath)
  }).then(() => {
    t.pass('blob file remove succeeded')
    return blobStore.exists(testBlobPath)
  }).then(result => {
    t.notOk(result, 'blob file no longer exists')
  }).then(() => {
    mock.restore()
  })
})
