const Promise = require('bluebird')
const path = require('path')
const fsBlobItemList = require('./fs-blob-item-list')
const fsBlobDirLatestFullDepth = require('./fs-blob-dir-latest-full-depth')

module.exports = function (state) {
  return fsBlobDirLatestFullDepth(state).then((fullBlobDirPath) => {
    var fullPath = path.join(state.blobStoreRoot, fullBlobDirPath)
    return fsBlobItemList(fullPath, state.validateId, false)
    .then((blobFileItems) => {
      return blobFileItems.length
    }).then((blobFileCount) => {
      if (blobFileCount >= state.dirWidth) {
        return path.dirname(fullBlobDirPath)
      }
      return fullBlobDirPath
    })
  }).then((newBlobPath) => {
    var blobPathIdCount = newBlobPath.split('/').length - 1
    if (blobPathIdCount === state.dirDepth) {
      return newBlobPath
    }

    return new Promise((resolve, reject) => {
      function trimFullBlobPath (nextPath) {
        return fsBlobItemList(nextPath, state.validateId, true)
        .then((blobDirItems) => {
          return blobDirItems.length
        }).then((blobDirCount) => {
          if (blobDirCount < state.dirWidth || nextPath.length === 1) {
            resolve(nextPath)
          } else {
            nextPath = path.dirname(nextPath)
            trimFullBlobPath(nextPath)
          }
        }).catch((err) => {
          reject(err)
        })
      }

      // Initiate Recursion
      trimFullBlobPath(newBlobPath)
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
