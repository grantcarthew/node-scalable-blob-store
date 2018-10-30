const BlobStore = require('../src/blob-store')
const del = require('del')
const ulid = require('ulid').ulid
const utils = require('./test-utils')
const blobStoreRoot = utils.genBlobStoreRoot('blob-store-current-blob-dir')
const testOptions = {
  blobStoreRoot,
  idFunction: ulid,
  dirWidth: 3
}
let dirs = {}

beforeAll(async () => {
  await del(blobStoreRoot, { force: true })
  dirs = await utils.buildTestFs(blobStoreRoot)
})

describe('scalable-blob-store currentBlobDir tests', () => {
  test('blobStore currentBlobDir test', async () => {
    expect.assertions(4)
    const bs = new BlobStore(testOptions)
    let dir = await bs.getCurrentBlobDir()
    expect(dir).toBe(dirs.latestBlobDir)
    await bs.setCurrentBlobDir(dirs.firstBlobDir)
    dir = await bs.getCurrentBlobDir()
    expect(dir).toBe(dirs.firstBlobDir)
    await bs.write(utils.data)
    dir = await bs.getCurrentBlobDir()
    expect(dir).toBe(dirs.firstBlobDir)
    await bs.write(utils.data)
    dir = await bs.getCurrentBlobDir()
    expect(dir).toBe(dirs.latestBlobDir)
  })
})
