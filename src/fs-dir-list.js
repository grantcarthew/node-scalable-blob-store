const fs = require('fs')
const path = require('path')

module.exports = function (state, parentPath) {
  var fullParentPath = path.join(state.blobStoreRoot, parentPath)
  return new Promise((resolve, reject) => {
    fs.readdir(fullParentPath, function (err, fsItems) {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve([])
        }
        return reject(err)
      }
      return resolve(fsItems)
    })
  })
}
