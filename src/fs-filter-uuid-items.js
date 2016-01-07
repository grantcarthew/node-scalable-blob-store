var idValidator = require('./id-validator')
var fsItemInfo = require('./fs-item-info')

module.exports = function (blobStoreRoot, parentPath, fsItems, onDirs) {
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return fsItemInfo(blobStoreRoot, parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory() === onDirs &&
             idValidator.isUuidV4(item.name, 4)
    })
  })
}
