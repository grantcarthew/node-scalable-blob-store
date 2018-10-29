const fsBlobDirList = require('../src/fs-blob-dir-list')
const fsBlobFileList = require('../src/fs-blob-file-list')
const utils = require('./test-utils')
const blobRoot = utils.genBlobStoreRoot('fs-modules')

beforeAll(async () => {
  await utils.buildTestFs(blobRoot)
})

describe('fs-modules tests', () => {
  test('fs-blob-dir-list tests', async () => {
    expect.assertions(4)
    let dirs = await fsBlobDirList(blobRoot, '/')
    expect(Array.isArray(dirs)).toBe(true)
    expect(dirs.length).toBe(6)
    dirs = await fsBlobDirList(blobRoot, 'does-not-exist')
    expect(Array.isArray(dirs)).toBe(true)
    expect(dirs.length).toBe(0)
  })

  test('fs-blob-file-list tests', async () => {
    expect.assertions(4)
    let dirs = await fsBlobFileList(blobRoot, '/')
    expect(Array.isArray(dirs)).toBe(true)
    expect(dirs.length).toBe(6)
    dirs = await fsBlobFileList(blobRoot, 'does-not-exist')
    expect(Array.isArray(dirs)).toBe(true)
    expect(dirs.length).toBe(0)
  })
})
