var path = require('path')
var uuid = require('node-uuid')
var fsItemCount = require('./fs-item-count')
var fsDirLatestFullDepth = require('./fs-dir-latest-full-depth')

module.exports = function (blobStoreRoot, dirDepth, dirWidth) {
  return fsDirLatestFullDepth(blobStoreRoot, dirDepth).then((linearBlobPath) => {
    return fsItemCount(blobStoreRoot, linearBlobPath, false).then((fileCount) => {
      if (fileCount >= dirWidth) {
        return path.dirname(linearBlobPath)
      }
      return linearBlobPath
    })
  }).then((newBlobPath) => {
    var blobPathUuidCount = newBlobPath.split('/').length - 1
    if (blobPathUuidCount === dirDepth) {
      return newBlobPath
    }

    return new Promise((resolve, reject) => {
      function trimBlobPath (nextPath) {
        fsItemCount(blobStoreRoot, nextPath, true).then((dirCount) => {
          if (dirCount < dirWidth || nextPath.length === 1) {
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
    var blobPathUuidCount = newBlobPath.split('/').length - 1
    if (blobPathUuidCount === dirDepth) {
      return newBlobPath
    }
    for (var i = dirDepth - blobPathUuidCount; i > 0; i--) {
      newBlobPath = newBlobPath + '/' + uuid.v4()
    }
    return newBlobPath
  })
}
