const path = require('path')
const fs = require('fs')
const fsBlobDirLatest = require('./fs-blob-dir-latest')

module.exports = async function fsBlobDirLatestFullDepth (state) {
  let loopIndex = state.dirDepth
  let blobPath = '/'
  await buildPath(blobPath)
  return blobPath

  async function buildPath (nextPath) {
    const fullNextPath = path.join(state.blobStoreRoot, nextPath)
    let dirLatest = await fsBlobDirLatest(fullNextPath)
    if (!dirLatest) {
      dirLatest = state.idFunction()
    }
    blobPath = path.join(blobPath, dirLatest)

    if (loopIndex < 2) {
      fs.mkdirSync(path.join(state.blobStoreRoot, blobPath), { recursive: true })
      return
    }

    loopIndex--
    await buildPath(blobPath)
  }
}
