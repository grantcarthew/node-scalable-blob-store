var path = require('path')
var idGenerator = require('./id-generator')
var fsItemCount = require('./fs-item-count')
var fsDirLatestFullDepth = require('./fs-dir-latest-full-depth')

module.exports = function (opts) {
  return fsDirLatestFullDepth(opts).then((linearBlobPath) => {
    return fsItemCount(opts, linearBlobPath, false).then((fileCount) => {
      if (fileCount >= opts.dirWidth) {
        return path.dirname(linearBlobPath)
      }
      return linearBlobPath
    })
  }).then((newBlobPath) => {
    var blobPathIdCount = newBlobPath.split('/').length - 1
    if (blobPathIdCount === opts.dirDepth) {
      return newBlobPath
    }

    return new Promise((resolve, reject) => {
      function trimBlobPath (nextPath) {
        fsItemCount(opts, nextPath, true).then((dirCount) => {
          if (dirCount < opts.dirWidth || nextPath.length === 1) {
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
    if (blobPathIdCount === opts.dirDepth) {
      return newBlobPath
    }
    for (var i = opts.dirDepth - blobPathIdCount; i > 0; i--) {
      newBlobPath = path.join(newBlobPath, idGenerator(opts.idType))
    }
    return newBlobPath
  })
}
