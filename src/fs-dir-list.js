var fs = require('fs')
var path = require('path')

module.exports = function (opts, parentPath) {
  var fullParentPath = path.join(opts.blobStoreRoot, parentPath)
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
