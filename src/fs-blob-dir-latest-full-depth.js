const Promise = require('bluebird')
const path = require('path')
const mkdir = require('fs')
const fsBlobDirLatest = require('./fs-blob-dir-latest')

module.exports = function (state) {
  var loopIndex = state.dirDepth
  var blobPath = '/'

  return new Promise((resolve, reject) => {
    function buildPath (nextPath) {
      var fullNextPath = path.join(state.blobStoreRoot, nextPath)
      return fsBlobDirLatest(fullNextPath, state.validateId).then((dir) => {
        if (!dir) {
          return state.newId()
        }
        return dir
      }).then((dir) => {
        blobPath = path.join(blobPath, dir)

        if (loopIndex === 1) {
          mkdirp(path.join(state.blobStoreRoot, blobPath))
          resolve(blobPath)
          return null
        } else {
          loopIndex--
          buildPath(blobPath)
          return null
        }
      }).catch((err) => {
        reject(err)
        return null
      })
    }

    // Initiate Recursion
    buildPath(blobPath)
    return null
  })
}
