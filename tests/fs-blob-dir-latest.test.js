const fsBlobDirLatest = require('../src/fs-blob-dir-latest')
const utils = require('./test-utils')
const blobStoreRoot = utils.genBlobStoreRoot('fs-blob-dir-latest')

describe('fs-blob-dir-latest tests', () => {
  test('return latest tests', async () => {
    try {
      const blobFs = await utils.buildTestFs(blobStoreRoot)

      const dir = await fsBlobDirLatest(blobStoreRoot)
      expect(dir).toBe(blobFs.latestFullDir.split('/')[1])

      await utils.rmBlobDir(blobStoreRoot)
    } catch (err) {
      console.error(err)
    }
  })
})
