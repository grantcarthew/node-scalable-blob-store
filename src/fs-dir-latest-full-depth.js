var path = require('path')
var mkdirp = require('mkdirp')
var uuid = require('node-uuid')
var fsDirLatest = require('./fs-dir-latest')

module.exports = function (blobStoreRoot, dirDepth) {
  var loopIndex = dirDepth
  var blobPath = '/'

  return new Promise((resolve, reject) => {
    function buildPath (nextPath) {
      fsDirLatest(blobStoreRoot, nextPath).then((dir) => {
        if (!dir) {
          return uuid.v4()
        }
        return dir
      }).then((dir) => {
        blobPath = path.join(blobPath, dir)

        if (loopIndex === 1) {
          mkdirp(path.join(blobStoreRoot, blobPath))
          resolve(blobPath)
        } else {
          loopIndex--
          buildPath(blobPath)
        }
      }).catch((err) => {
        reject(err)
      })
    }

    // Initiate Recursion
    buildPath(blobPath)
  })
}
