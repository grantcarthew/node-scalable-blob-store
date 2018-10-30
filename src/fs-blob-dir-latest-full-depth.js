const path = require('path')
const fs = require('fs')
const fsBlobDirLatest = require('./fs-blob-dir-latest')

module.exports = fsBlobDirLatestFullDepth

/**
 * Returns the most recent directory within the blobStoreRoot path.
 * Creates the directories down to the dirDepth if they don't exist.
 *
 * @param {Object} state
 * @returns {Promise<String>}
 */
async function fsBlobDirLatestFullDepth (state) {
  let loopIndex = state.dirDepth
  let blobDir = '/'
  await dirFindOrCreate(blobDir)
  return blobDir

  /**
   * Starting at the blobStoreRoot it will find the latest
   * directory or create one. Loops down to the dirDepth
   * based on the loopIndex closure variable.
   *
   * @param {String} nextDir
   * @returns {Promise<void>}
   */
  async function dirFindOrCreate (nextDir) {
    const fullNextPath = path.join(state.blobStoreRoot, nextDir)
    let dirLatest = await fsBlobDirLatest(fullNextPath)
    if (!dirLatest) {
      dirLatest = state.idFunction()
    }
    // @ts-ignore
    blobDir = path.join(blobDir, dirLatest)

    if (loopIndex < 2) {
      // @ts-ignore
      fs.mkdirSync(path.join(state.blobStoreRoot, blobDir), { recursive: true })
      return
    }

    loopIndex--
    await dirFindOrCreate(blobDir)
  }
}
