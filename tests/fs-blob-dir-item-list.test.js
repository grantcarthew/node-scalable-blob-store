const fsBlobDirItemList = require('../src/fs-blob-dir-item-list')
const utils = require('./test-utils')
const blobRoot = utils.genBlobStoreRoot('fs-modules')

beforeAll(async () => {
  await utils.buildTestFs(blobRoot)
})

describe('fs-modules tests', () => {
  test('fs-blob-dir-list tests', async () => {
    expect.assertions(8)
    let items = await fsBlobDirItemList(blobRoot, '/')
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBe(6)
    items = await fsBlobDirItemList(blobRoot, 'does-not-exist')
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBe(0)
    items = await fsBlobDirItemList(blobRoot, '/', 'isDirectory')
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBe(6)
    items = await fsBlobDirItemList(blobRoot, 'does-not-exist', 'isDirectory')
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBe(0)
  })
})
