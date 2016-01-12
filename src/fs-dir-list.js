const fs = require('fs')

module.exports = function (fsPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(fsPath, function (err, fsItems) {
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
