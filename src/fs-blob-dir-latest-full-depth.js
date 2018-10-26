const path = require('path')
const fs = require('fs')
const fsBlobDirLatest = require('./fs-blob-dir-latest')

module.exports = fsBlobDirLatestFullDepth

/**
 *  Returns the most recent directory within the blobStoreRoot path.
 *  Creates the directories down to the dirDepth if they don't exist.
 *
 * @param {object} state
 * @returns {Promise<string>}
 */
async function fsBlobDirLatestFullDepth (state) {
  let loopIndex = state.dirDepth
  let blobPath = '/'
  await dirFindOrCreate(blobPath)
  return blobPath

  /**
   * Starting at the blobStoreRoot it will find the latest
   * directory or create one. Loops down to the dirDepth
   * based on the loopIndex closure variable.
   *
   * @param {string} nextPath
   * @returns {Promise<undefined>}
   */
  async function dirFindOrCreate (nextPath) {
    const fullNextPath = path.join(state.blobStoreRoot, nextPath)
    let dirLatest = await fsBlobDirLatest(fullNextPath)
    if (!dirLatest) {
      dirLatest = state.idFunction()
    }
    // @ts-ignore
    blobPath = path.join(blobPath, dirLatest)

    if (loopIndex < 2) {
      // @ts-ignore
      fs.mkdirSync(path.join(state.blobStoreRoot, blobPath), { recursive: true })
      return
    }

    loopIndex--
    await dirFindOrCreate(blobPath)
  }
}
