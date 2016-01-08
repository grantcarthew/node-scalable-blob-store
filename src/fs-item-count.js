const fsDirList = require('./fs-dir-list')
const fsFilterIdItems = require('./fs-filter-id-items')

module.exports = function (state, parentPath, onDir) {
  return fsDirList(state.blobStoreRoot, parentPath).then((fsItems) => {
    if (onDir) {
      return fsFilterIdItems(state, parentPath, fsItems, true)
    }
    return fsFilterIdItems(state, parentPath, fsItems, false)
  }).then((dirs) => {
    return dirs.length
  })
}
