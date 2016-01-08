var fsDirList = require('./fs-dir-list')
var fsFilterIdItems = require('./fs-filter-id-items')

module.exports = function (opts, parentPath) {
  return fsDirList(opts, parentPath).then((fsItems) => {
    return fsFilterIdItems(opts, parentPath, fsItems, true)
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
