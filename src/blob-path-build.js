const path = require('path')
const fsBlobItemList = require('./fs-blob-item-list')
const fsDirLatestFullDepth = require('./fs-dir-latest-full-depth')

module.exports = function (state) {
  return fsDirLatestFullDepth(state).then((linearBlobPath) => {
    var fullPath = path.join(state.blobStoreRoot, linearBlobPath)
    return fsBlobItemList(fullPath, state.validateId, false).then(blobFileItems => {
      return blobFileItems.length
    }).then((fileCount) => {
      if (fileCount >= state.dirWidth) {
        return path.dirname(linearBlobPath)
      }
      return linearBlobPath
    })
  }).then((newBlobPath) => {
    var blobPathIdCount = newBlobPath.split('/').length - 1
    if (blobPathIdCount === state.dirDepth) {
      return newBlobPath
    }

    return new Promise((resolve, reject) => {
      function trimBlobPath (nextPath) {
        return fsBlobItemList(nextPath, state.validateId, true).then(blobDirItems => {
          return blobDirItems.length
        }).then((blobDirCount) => {
          if (blobDirCount < state.dirWidth || nextPath.length === 1) {
            resolve(nextPath)
          } else {
            nextPath = path.dirname(nextPath)
            trimBlobPath(nextPath)
          }
        }).catch((err) => {
          reject(err)
        })
      }

      // Initiate Recursion
      trimBlobPath(newBlobPath)
    })
  }).then((newBlobPath) => {
    var blobPathIdCount = newBlobPath.split('/').length - 1
    if (blobPathIdCount === state.dirDepth) {
      return newBlobPath
    }
    for (var i = state.dirDepth - blobPathIdCount; i > 0; i--) {
      newBlobPath = path.join(newBlobPath, state.newId())
    }
    return newBlobPath
  })
}
