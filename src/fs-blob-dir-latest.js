const path = require('path')
const fsp = require('fs').promises

module.exports = async function (fsPath) {
  const fsItems = await fsp.readdir(fsPath)
  const fsBlobDirList = []

  try {
    for (const fsItem of fsItems) {
      const fsItemPath = path.join(fsPath, fsItem)
      const fsItemStat = await fsp.stat(fsItemPath)
      fsItemStat.isDirectory() && fsBlobDirList.push({
        fsItem,
        fsItemStat
      })
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    }
    throw err
  }

  if (fsBlobDirList.length < 1) {
    return false
  }

  fsBlobDirList.sort((a, b) => {
    return b.fsItemStat.birthtime.getTime() - a.fsItemStat.birthtime.getTime()
  })

  return fsBlobDirList[0].fsItem
}
