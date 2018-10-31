const mkdir = require('fs').promises.mkdir
const path = require('path')
const fsBlobDirItemList = require('./fs-blob-dir-item-list')
const fsBlobDirLatestFullDepth = require('./fs-blob-dir-latest-full-depth')

module.exports = blobDirBuild

/**
 * Returns a new blob directory following the dirDepth and dirWidth restrictions.
 * Creates the directory if it doesn't exist.
 *
 * @param {Object} state
 * @returns {Promise<String>}
 */
async function blobDirBuild (state) {
  const fullBlobDirPath = await fsBlobDirLatestFullDepth(state)
  const blobFiles = await fsBlobDirItemList(state.blobStoreRoot, fullBlobDirPath)
  let newBlobPath = fullBlobDirPath

  if (blobFiles.length >= state.dirWidth) {
    newBlobPath = path.dirname(fullBlobDirPath)
  }

  // The .filter below removes the empty string in the split array
  let blobPathIdCount = newBlobPath.split('/').filter(x => x).length
  if (blobPathIdCount < state.dirDepth) {
    newBlobPath = await trimFullBlobPath(state, newBlobPath)

    blobPathIdCount = newBlobPath.split('/').filter(x => x).length
    for (let i = state.dirDepth - blobPathIdCount; i > 0; i--) {
      newBlobPath = path.join(newBlobPath, state.idFunction())
    }
  }

  await mkdir(path.join(state.blobStoreRoot, newBlobPath), { recursive: true })
  return newBlobPath
}

/**
 * Climbs up the blobPath looking for directories less than the dirWidth value.
 * Returns first directory that is less than the dirWidth value.
 *
 * @param {Object} state
 * @param {String} blobPath
 * @returns {Promise<String>}
 */
async function trimFullBlobPath (state, blobPath) {
  return trimFullBlobPathRecursive(blobPath)

  async function trimFullBlobPathRecursive (nextPath) {
    const blobDirItems = await fsBlobDirItemList(state.blobStoreRoot, nextPath, false)
    if (blobDirItems.length >= state.dirWidth && nextPath.length > 1) {
      const parentPath = path.dirname(nextPath)
      return trimFullBlobPathRecursive(parentPath)
    }
    return nextPath
  }
}
