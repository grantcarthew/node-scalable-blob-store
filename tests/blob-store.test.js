const BlobStore = require('../src/blob-store')
const os = require('os')
const fs = require('fs')
const del = require('del')
const ulid = require('ulid').ulid
const streamToString = require('./test-streamtostring')
const crispyStream = require('crispy-stream')
const data = 'The quick brown fox jumps over the lazy dog'
const blobStoreRoot = os.tmpdir() + '/sbs/blob-store'
const testOptions = {
  blobStoreRoot,
  idFunction: ulid
}

describe('scalable-blob-store tests', () => {
  test('basic constructor test', async () => {
    await del(blobStoreRoot, { force: true })
    const options = {}
    expect(() => new BlobStore()).toThrow()
    expect(() => new BlobStore(options)).toThrow()
    options.blobStoreRoot = blobStoreRoot
    expect(() => new BlobStore(options)).toThrow()
    options.idFunction = ulid
    expect(new BlobStore(options)).toBeDefined()
    expect(fs.existsSync(blobStoreRoot)).toBe(true)
  })

  test('createWriteStream test', async () => {
    const bs = new BlobStore(testOptions)
    const ws = await bs.createWriteStream()
    expect(typeof ws.blobPath).toBe('string')
    expect(typeof ws.writeStream).toBe('object')
    expect(bs.createWriteStream()).toBeDefined()
  })
})
