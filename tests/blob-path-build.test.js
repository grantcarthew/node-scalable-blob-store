const blobDirBuild = require('../src/blob-dir-build')
const utils = require('./test-utils')
const blobRoot = utils.genBlobStoreRoot('blob-path-build')

const state = {
  blobStoreRoot: blobRoot,
  idFunction,
  dirDepth: 3,
  dirWidth: 1000
}

describe('blob-path-build tests', () => {
  test('blob-path-build tests', async () => {
    expect.assertions(2)
    await utils.rmBlobDir(blobRoot)
    await utils.mkBlobDir(blobRoot)
    let dir = await blobDirBuild(state)
    expect(dir).toBe('/1/2/3')
    const blobFs = await utils.buildTestFs(blobRoot)
    dir = await blobDirBuild(state)
    expect(dir).toBe(blobFs.latestBlobDir)
    await utils.rmBlobDir(blobRoot)
  })
})

let i = 1
function idFunction () {
  return '' + i++
}
