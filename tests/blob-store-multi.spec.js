const test = require('tape')
const mock = require('mock-fs')
const Promise = require('bluebird')
const sbsFactory = require('../src/blob-store.js')
const crispyStream = require('crispy-stream')
const data = 'The quick brown fox jumped over the lazy dog'
const readStream = crispyStream.createReadStream(data)

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

const blobStoreA = sbsFactory.create(optionsA)
const blobStoreB = sbsFactory.create(optionsB)
var testBlobPathA = ''
var testBlobPathB = ''

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

test('blob-store multi tests', (t) => {
  mock()

  t.plan(22)
  var promises = []
  promises.push(blobStoreA.createWriteStream()
  .then((result) => {
    t.ok(result.blobPath, 'BlobStoreA createWriteStream blob path created')
    t.ok(result.writeStream, 'BlobStoreA createWriteStream writeStream created')
    testBlobPathA = result.blobPath
    return new Promise((resolve, reject) => {
      result.writeStream.on('finish', () => {
        t.pass('BlobStoreA blob file write succeeded')
        resolve(result.blobPath)
      })
      result.writeStream.on('error', reject)
      readStream.pipe(result.writeStream)
    })
  }).then((blobPath) => {
    return blobStoreA.createReadStream(blobPath)
  }).then((readStream) => {
    return streamToString(readStream)
  }).then((result) => {
    t.equal(result, data, 'BlobStoreA blob file read succeeded')
  }).then(() => {
    return blobStoreA.exists(testBlobPathA)
  }).then((result) => {
    t.ok(result, 'BlobStoreA blob file exists succeeded')
  }).then(() => {
    return blobStoreA.stat(testBlobPathA)
  }).then((stat) => {
    t.equal(stat.size, 44, 'BlobStoreA blob file stat succeeded')
  }).then(() => {
    return blobStoreA.remove(testBlobPathA)
  }).then(() => {
    t.pass('BlobStoreA blob file remove succeeded')
    return blobStoreA.exists(testBlobPathA)
  }).then((result) => {
    t.notOk(result, 'BlobStoreA blob file no longer exists')
  }).then(() => {
    return blobStoreA.createReadStream('/invalidread')
  }).then((readStream) => {
    readStream.on('error', (err) => {
      t.ok(err, 'BlobStoreA createReadStream on invalid path raises error event')
    })
  }).then(() => {
    return blobStoreA.stat('/invalidstat').catch((err) => {
      t.ok(err, 'BlobStoreA stat on invalid path throws error')
    })
  }).then(() => {
    return blobStoreA.remove('/invalidremove')
  }).then((result) => {
    t.deepEqual(result, undefined, 'BlobStoreA remove on invalid path returns undefined')
  }))

  promises.push(blobStoreB.createWriteStream()
  .then((result) => {
    t.ok(result.blobPath, 'BlobStoreB createWriteStream blob path created')
    t.ok(result.writeStream, 'BlobStoreB createWriteStream writeStream created')
    testBlobPathB = result.blobPath
    return new Promise((resolve, reject) => {
      result.writeStream.on('finish', () => {
        t.pass('BlobStoreB blob file write succeeded')
        resolve(result.blobPath)
      })
      result.writeStream.on('error', reject)
      readStream.pipe(result.writeStream)
    })
  }).then((blobPath) => {
    return blobStoreB.createReadStream(blobPath)
  }).then((readStream) => {
    return streamToString(readStream)
  }).then((result) => {
    t.equal(result, data, 'BlobStoreB blob file read succeeded')
  }).then(() => {
    return blobStoreB.exists(testBlobPathB)
  }).then((result) => {
    t.ok(result, 'BlobStoreB blob file exists succeeded')
  }).then(() => {
    return blobStoreB.stat(testBlobPathB)
  }).then((stat) => {
    t.equal(stat.size, 44, 'BlobStoreB blob file stat succeeded')
  }).then(() => {
    return blobStoreB.remove(testBlobPathB)
  }).then(() => {
    t.pass('BlobStoreB blob file remove succeeded')
    return blobStoreB.exists(testBlobPathB)
  }).then((result) => {
    t.notOk(result, 'BlobStoreB blob file no longer exists')
  }).then(() => {
    return blobStoreB.createReadStream('/invalidread')
  }).then((readStream) => {
    readStream.on('error', (err) => {
      t.ok(err, 'BlobStoreB createReadStream on invalid path raises error event')
    })
  }).then(() => {
    return blobStoreB.stat('/invalidstat').catch((err) => {
      t.ok(err, 'BlobStoreB stat on invalid path throws error')
    })
  }).then(() => {
    return blobStoreB.remove('/invalidremove')
  }).then((result) => {
    t.deepEqual(result, undefined, 'BlobStoreB remove on invalid path returns undefined')
  }))

  return Promise.all(promises).then(() => {
    mock.restore()
  })
})
