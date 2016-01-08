var fsItemInfo = require('./fs-item-info')

module.exports = function (opts, parentPath, fsItems, onDirs) {
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return fsItemInfo(opts, parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory() === onDirs &&
             opts.validateId(item.name)
    })
  })
}
