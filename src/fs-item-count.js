var fsDirList = require('./fs-dir-list')
var fsFilterIdItems = require('./fs-filter-id-items')

module.exports = function (state, parentPath, onDir) {
  return fsDirList(state, parentPath).then((fsItems) => {
    if (onDir) {
      return fsFilterIdItems(state, parentPath, fsItems, true)
    }
    return fsFilterIdItems(state, parentPath, fsItems, false)
  }).then((dirs) => {
    return dirs.length
  })
}
