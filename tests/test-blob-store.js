const Promise = require('bluebird')
const sbsFactory = require('../dist/blob-store.js')
const streamToString = require('./test-streamtostring')
const crispyStream = require('crispy-stream')
const data = 'The quick brown fox jumped over the lazy dog'

module.exports = async function testBlobStore (t, opt, postfix = '') {
  const blobStore = sbsFactory.create(opt)

  const ws1 = await blobStore.createWriteStream()
  t.ok(ws1.blobPath, 'createWriteStream blob path created' + postfix)
  t.ok(ws1.writeStream, 'createWriteStream writeStream created' + postfix)
  let testBlobPath = ws1.blobPath
  const crispyReadStream = crispyStream.createReadStream(data)
  const blobPath = await new Promise((resolve, reject) => {
    ws1.writeStream.on('finish', () => {
      t.pass('blob file write succeeded' + postfix)
      resolve(ws1.blobPath)
    })
    ws1.writeStream.on('error', reject)
    crispyReadStream.pipe(ws1.writeStream)
  })
  const rs1 = blobStore.createReadStream(blobPath)
  const read = await streamToString(rs1)
  t.equal(read, data, 'blob file read succeeded' + postfix)
  const exists = await blobStore.exists(testBlobPath)
  t.ok(exists, 'blob file exists succeeded' + postfix)
  const stat = await blobStore.stat(testBlobPath)
  t.equal(stat.size, 44, 'blob file stat succeeded' + postfix)
  const remove = await blobStore.remove(testBlobPath)
  t.deepEqual(remove, undefined, 'blob file remove succeeded' + postfix)
  const notExists = await blobStore.exists(testBlobPath)
  t.notOk(notExists, 'blob file no longer exists' + postfix)
  const rs2 = await blobStore.createReadStream('/invalidread')
  rs2.on('error', (err) => {
    t.ok(err, 'createReadStream on invalid path raises error event' + postfix)
  })
  try {
    const invalidStat = await blobStore.stat('/invalidstat')
  } catch (err) {
    t.ok(err, 'stat on invalid path throws error' + postfix)
  }
  const invalidRemove = await blobStore.remove('/invalidremove')
  t.deepEqual(invalidRemove, undefined, 'remove on invalid path result = awaits undefined' + postfix)
}

