const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

module.exports = function (fsPath, validateId, onDirOrFile) {
  return fs.readdirAsync(fsPath).filter(fsItem => {
    var fsItemPath = path.join(fsPath, fsItem)
    return fs.statAsync(fsItemPath).then(stat => {
      return onDirOrFile ? stat.isDirectory() : stat.isFile()
    }).catch(err => {
      console.error(err)
      return false
    })
  }).filter(fsItemName => {
    return validateId(fsItemName)
  }).catch(err => {
    if (err.code === 'ENOENT') {
      return []
    }
    throw err
  })
}
