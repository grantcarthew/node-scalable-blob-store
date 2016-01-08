const fsDirList = require('./fs-dir-list')
const fsFilterIdItems = require('./fs-filter-id-items')

module.exports = function (state, parentPath) {
  return fsDirList(state, parentPath).then((fsItems) => {
    return fsFilterIdItems(state, parentPath, fsItems, true)
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
