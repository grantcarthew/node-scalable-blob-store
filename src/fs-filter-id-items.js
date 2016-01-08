const fsItemInfo = require('./fs-item-info')

module.exports = function (state, parentPath, fsItems, onDirs) {
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return fsItemInfo(state, parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory() === onDirs &&
             state.validateId(item.name)
    })
  })
}
