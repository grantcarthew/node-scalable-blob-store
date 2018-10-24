const path = require('path')
const fsBlobFileList = require('./fs-blob-file-list')
const fsBlobDirList = require('./fs-blob-dir-list')
const fsBlobDirLatestFullDepth = require('./fs-blob-dir-latest-full-depth')

module.exports = async function (state) {
  const fullBlobDirPath = await fsBlobDirLatestFullDepth(state)
  const blobFiles = await fsBlobFileList(state.blobStoreRoot, fullBlobDirPath)
  let newBlobPath = fullBlobDirPath
  if (blobFiles.length >= state.dirWidth) {
    newBlobPath = path.dirname(fullBlobDirPath)
  }
  let isFullDepth = fullDepthPath(state, newBlobPath)
  if (!isFullDepth) {
    newBlobPath = await trimFullBlobPath(state, newBlobPath)
  }

  isFullDepth = fullDepthPath(state, newBlobPath)

  if (isFullDepth) {
    return newBlobPath
  }

  const blobPathIdCount = newBlobPath.split('/').length - 1
  for (var i = state.dirDepth - blobPathIdCount; i > 0; i--) {
    newBlobPath = path.join(newBlobPath, state.idFunction())
  }
  return newBlobPath
}

function fullDepthPath (state, blobPath) {
  const blobPathIdCount = blobPath.split('/').length - 1
  return blobPathIdCount === state.dirDepth
}

async function trimFullBlobPath (state, blobPath) {
  let trimmedPath = ''
  trimFullBlobPathRecursive(blobPath)
  return trimmedPath

  async function trimFullBlobPathRecursive (nextPath) {
    const blobDirItems = await fsBlobDirList(state, nextPath)
    if (blobDirItems.length < state.dirWidth || nextPath.length < 2) {
      trimmedPath = nextPath
    }
    const parentPath = path.dirname(nextPath)
    trimFullBlobPathRecursive(parentPath)
  }
}
