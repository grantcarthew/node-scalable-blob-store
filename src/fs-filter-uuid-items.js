var validator = require('validator')
var fsItemInfo = require('./fs-item-info')

module.exports = function (blobStoreRoot, parentPath, fsItems, onDirs) {
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return fsItemInfo(blobStoreRoot, parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory() === onDirs &&
             validator.isUUID(item.name, 4)
    })
  })
}
