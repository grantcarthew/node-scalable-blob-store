const os = require('os')
const test = require('tape')
const mock = require('mock-fs')
const sbsFactory = require('../dist/blob-store.js')
const streamToString = require('./test-streamtostring')
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

module.exports = async function blobStoreApiCallbackSpec () {
  test('blob-store api callback tests', (t) => {
    mock()

    t.plan(11)
    blobStore.createWriteStream((err1, result) => {
      if (err1) { t.fail(err1.message) }
      t.ok(result.blobPath, 'createWriteStream blob path created')
      t.ok(result.writeStream, 'createWriteStream writeStream created')
      testBlobPath = result.blobPath
      result.writeStream.on('finish', () => {
        t.pass('blob file write succeeded')
        var blobReadStream = blobStore.createReadStream(result.blobPath)
        streamToString(blobReadStream, (err2, readData) => {
          if (err2) { t.fail(err2.message) }
          t.equal(readData, data, 'blob file read succeeded')
          blobStore.exists(testBlobPath, (err3, exists) => {
            if (err3) { t.fail(err3.message) }
            t.ok(exists, 'blob file exists succeeded')
            blobStore.stat(testBlobPath, (err4, statData) => {
              if (err4) { t.fail(err4.message) }
              t.equal(statData.size, 44, 'blob file stat succeeded')
              blobStore.remove(testBlobPath, (err5) => {
                if (err5) { t.fail(err5.message) }
                t.deepEqual(err5, undefined, 'blob file remove succeeded')
                blobStore.exists(testBlobPath, (err6, existsNot) => {
                  if (err6) { t.fail(err6.message) }
                  t.notOk(existsNot, 'blob file no longer exists')
                  var invalidReadStream = blobStore.createReadStream('/invalidread')
                  invalidReadStream.on('error', (err7) => {
                    t.ok(err7, 'createReadStream on invalid path raises error event')
                    blobStore.stat('/invalidstat', (err8, invalidStat) => {
                      t.ok(err8, 'stat on invalid path throws error')
                      blobStore.remove('/invalidremove', (err9) => {
                        if (err9) { t.fail(err9.message) }
                        t.deepEqual(err9, undefined, 'remove on invalid path returns undefined')
                        return mock.restore()
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
      result.writeStream.on('error', console.log.bind(console))
      readStream.pipe(result.writeStream)
    })
  })
}
