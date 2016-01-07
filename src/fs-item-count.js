var fsDirList = require('./fs-dir-list')
var fsFilterUuidItems = require('./fs-filter-uuid-items')

module.exports = function (blobStoreRoot, parentPath, onDir) {
  return fsDirList(blobStoreRoot, parentPath).then((fsItems) => {
    if (onDir) {
      return fsFilterUuidItems(blobStoreRoot, parentPath, fsItems, true)
    }
    return fsFilterUuidItems(blobStoreRoot, parentPath, fsItems, false)
  }).then((dirs) => {
    return dirs.length
  })
}
