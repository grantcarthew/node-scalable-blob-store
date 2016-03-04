const test = require('tape')
const mock = require('mock-fs')
const Promise = require('bluebird')
const sbsFactory = require('../dist/blob-store.js')
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

test('blob-store api tests', (t) => {
  mock()

  t.plan(11)
  return blobStore.createWriteStream()
  .then((result) => {
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
  }).then((blobPath) => {
    return blobStore.createReadStream(blobPath)
  }).then((readStream) => {
    return streamToString(readStream)
  }).then((result) => {
    t.equal(result, data, 'blob file read succeeded')
  }).then(() => {
    return blobStore.exists(testBlobPath)
  }).then((result) => {
    t.ok(result, 'blob file exists succeeded')
  }).then(() => {
    return blobStore.stat(testBlobPath)
  }).then((stat) => {
    t.equal(stat.size, 44, 'blob file stat succeeded')
  }).then(() => {
    return blobStore.remove(testBlobPath)
  }).then((result) => {
    t.deepEqual(result, undefined, 'blob file remove succeeded')
    return blobStore.exists(testBlobPath)
  }).then((result) => {
    t.notOk(result, 'blob file no longer exists')
  }).then(() => {
    return blobStore.createReadStream('/invalidread')
  }).then((readStream) => {
    readStream.on('error', (err) => {
      t.ok(err, 'createReadStream on invalid path raises error event')
    })
  }).then(() => {
    return blobStore.stat('/invalidstat').catch((err) => {
      t.ok(err, 'stat on invalid path throws error')
    })
  }).then(() => {
    return blobStore.remove('/invalidremove')
  }).then((result) => {
    t.deepEqual(result, undefined, 'remove on invalid path returns undefined')
  }).then(() => {
    mock.restore()
  })
})
