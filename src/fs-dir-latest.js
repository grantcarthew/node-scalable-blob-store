var fsDirList = require('./fs-dir-list')
var fsFilterUuidItems = require('./fs-filter-uuid-items')

module.exports = function (blobStoreRoot, parentPath) {
  var self = this
  return fsDirList(blobStoreRoot, parentPath).then((fsItems) => {
    return fsFilterUuidItems(blobStoreRoot, parentPath, fsItems, true)
  }).then((dirs) => {
    if (!dirs || dirs.length === 0) {
      return false
    }
    dirs.sort((a, b) => {
      return b.stat.birthtime.getTime() - a.stat.birthtime.getTime()
    })
    return dirs[0].name
  })
}
