const path = require('path')
const fsItemCount = require('./fs-item-count')
const fsDirLatestFullDepth = require('./fs-dir-latest-full-depth')

module.exports = function (state) {
  return fsDirLatestFullDepth(state).then((linearBlobPath) => {
    return fsItemCount(state, linearBlobPath, false).then((fileCount) => {
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
        fsItemCount(state, nextPath, true).then((dirCount) => {
          if (dirCount < state.dirWidth || nextPath.length === 1) {
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
