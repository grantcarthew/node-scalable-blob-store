const path = require('path')
const mkdirp = require('mkdirp')
const fsDirLatest = require('./fs-dir-latest')

module.exports = function (state) {
  var loopIndex = state.dirDepth
  var blobPath = '/'

  return new Promise((resolve, reject) => {
    function buildPath (nextPath) {
      fsDirLatest(state, nextPath).then((dir) => {
        if (!dir) {
          return state.newId()
        }
        return dir
      }).then((dir) => {
        blobPath = path.join(blobPath, dir)

        if (loopIndex === 1) {
          mkdirp(path.join(state.blobStoreRoot, blobPath))
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
