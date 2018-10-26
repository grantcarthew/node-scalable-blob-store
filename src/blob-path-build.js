const mkdir = require('fs').promises.mkdir
const path = require('path')
const fsBlobFileList = require('./fs-blob-file-list')
const fsBlobDirList = require('./fs-blob-dir-list')
const fsBlobDirLatestFullDepth = require('./fs-blob-dir-latest-full-depth')

module.exports = blobPathBuild

/**
 *  Returns a new blob path following the dirDepth and dirWidth restrictions.
 *  Creates the directory if it doesn't exist.
 *
 * @param {object} state
 * @returns {Promise<string>}
 */
async function blobPathBuild (state) {
  const fullBlobDirPath = await fsBlobDirLatestFullDepth(state)
  const blobFiles = await fsBlobFileList(state.blobStoreRoot, fullBlobDirPath)
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
 *  Climbs up the blobPath looking for directories less than the dirWidth value.
 *  Returns first directory that is less than the dirWidth value.
 *
 * @param {object} state
 * @param {string} blobPath
 * @returns {Promise<string>}
 */
async function trimFullBlobPath (state, blobPath) {
  let trimmedPath = ''
  await trimFullBlobPathRecursive(blobPath)
  return trimmedPath

  async function trimFullBlobPathRecursive (nextPath) {
    const blobDirItems = await fsBlobDirList(state.blobStoreRoot, nextPath)
    if (blobDirItems.length < state.dirWidth || nextPath.length < 2) {
      trimmedPath = nextPath
      return
    }
    const parentPath = path.dirname(nextPath)
    await trimFullBlobPathRecursive(parentPath)
  }
}
