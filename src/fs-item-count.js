var fsDirList = require('./fs-dir-list')
var fsFilterIdItems = require('./fs-filter-id-items')

module.exports = function (opts, parentPath, onDir) {
  return fsDirList(opts, parentPath).then((fsItems) => {
    if (onDir) {
      return fsFilterIdItems(opts, parentPath, fsItems, true)
    }
    return fsFilterIdItems(opts, parentPath, fsItems, false)
  }).then((dirs) => {
    return dirs.length
  })
}
