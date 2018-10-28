const BlobStore = require('../src/blob-store')
const ulid = require('ulid').ulid
const del = require('del')
const utils = require('./test-utils')
const streamToString = require('./test-streamtostring')
const crispyStream = require('crispy-stream')
const data = 'The quick brown fox jumps over the lazy dog'
const blobStoreRoot = utils.genBlobStoreRoot('blob-store-read-write')
const testOptions = {
  blobStoreRoot,
  idFunction: ulid
}

describe('scalable-blob-store read/write tests', () => {
  test('read/write, exists, stat, and remove tests', async () => {
    await del(blobStoreRoot, { force: true })
    const bs = new BlobStore(testOptions)
    const ws1 = await bs.createWriteStream()
    expect(typeof ws1.blobPath).toBe('string')
    expect(typeof ws1.writeStream).toBe('object')
    let testBlobPath = ws1.blobPath
    const crispyReadStream = crispyStream.createReadStream(data)
    const blobPath = await new Promise((resolve, reject) => {
      ws1.writeStream.on('finish', () => {
        expect(true)
        resolve(ws1.blobPath)
      })
      ws1.writeStream.on('error', reject)
      crispyReadStream.pipe(ws1.writeStream)
    })
    const rs1 = bs.createReadStream(blobPath)
    const read = await streamToString(rs1)
    expect(read).toBe(data)
    const exists = await bs.exists(testBlobPath)
    expect(exists).toBe(true)
    const stat = await bs.stat(testBlobPath)
    expect(stat.size).toBe(43)
    const remove = await bs.remove(testBlobPath)
    expect(remove).toBeUndefined()
    const notExists = await bs.exists(testBlobPath)
    expect(notExists).toBe(false)
    const rs2 = await bs.createReadStream('/invalidread')
    rs2.on('error', (err) => {
      expect(err.code).toBe('ENOENT')
    })
    try {
      await bs.stat('/invalidstat')
    } catch (err) {
      expect(err.code).toBe('ENOENT')
    }
    const invalidRemove = await bs.remove('/invalidremove')
    expect(invalidRemove).toBeUndefined()
  })
})
