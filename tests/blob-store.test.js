const BlobStore = require('../src/blob-store')
const fs = require('fs')
const del = require('del')
const ulid = require('ulid').ulid
const utils = require('./test-utils')
const blobStoreRoot = utils.genBlobStoreRoot('blob-store')
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
