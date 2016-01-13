const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

module.exports = function (fsPath, validateId) {
  return fs.readdirAsync(fsPath).map(fsItem => {
    var fsItemPath = path.join(fsPath, fsItem)
    return fs.statAsync(fsItemPath).then(fsItemStat => {
      return {
        name: fsItem,
        stat: fsItemStat
      }
    })
  }).filter(fsUnknownItem => {
    return fsUnknownItem.stat.isDirectory()
  }).filter(fsUnvalidatedDirList => {
    return validateId(fsUnvalidatedDirList.name)
  }).then(fsDirList => {
    if (!fsDirList || fsDirList.length === 0) {
      return false
    }
    fsDirList.sort((a, b) => {
      return b.stat.birthtime.getTime() - a.stat.birthtime.getTime()
    })
    return fsDirList[0].name
  }).catch(err => {
    if (err.code === 'ENOENT') {
      return false
    }
    throw err
  })
}
