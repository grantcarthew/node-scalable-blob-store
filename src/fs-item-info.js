const fs = require('fs')
const path = require('path')

module.exports = function (state, parentPath, fsItems) {
  return new Promise((resolve, reject) => {
    var stats = []
    var fullParentPath = path.join(state.blobStoreRoot, parentPath)
    fsItems.forEach((item, index) => {
      var fullPath = path.join(fullParentPath, item)
      fs.stat(fullPath, (err, stat) => {
        if (err) {
          if (err.code === 'ENOENT') {
            return
          }
          return reject(err)
        }
        stats.push({
          name: item,
          stat: stat
        })
        if (index === fsItems.length - 1) {
          resolve(stats)
        }
      })
    })
  })
}
