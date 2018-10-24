const BlobStore = require('../src/blob-store')
const os = require('os')
const fs = require('fs')
const ulid = require('ulid').ulid
const testDir = os.tmpdir() + '/sbs/blob-store'

describe('scalable-blob-store tests', () => {
  test('basic constructor test', () => {
    const options = {}
    expect(() => new BlobStore()).toThrow()
    expect(() => new BlobStore(options)).toThrow()
    options.blobStoreRoot = testDir
    expect(() => new BlobStore(options)).toThrow()
    options.idFunction = ulid
    expect(new BlobStore(options)).toBeDefined()
    expect(fs.existsSync(testDir)).toBe(true)
  })
})
