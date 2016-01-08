var path = require('path')
var mkdirp = require('mkdirp')
var fsDirLatest = require('./fs-dir-latest')

module.exports = function (opts) {
  var loopIndex = opts.dirDepth
  var blobPath = '/'

  return new Promise((resolve, reject) => {
    function buildPath (nextPath) {
      fsDirLatest(opts, nextPath).then((dir) => {
        if (!dir) {
          return opts.newId()
        }
        return dir
      }).then((dir) => {
        blobPath = path.join(blobPath, dir)

        if (loopIndex === 1) {
          mkdirp(path.join(opts.blobStoreRoot, blobPath))
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
