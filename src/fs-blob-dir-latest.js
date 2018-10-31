const path = require('path')
const fsp = require('fs').promises

module.exports = fsBlobDirLatest

/**
 *  Returns the most recently created directory from within the fsPath.
 *  Returns false if the fsPath does not exist or has no directories within it.
 *
 *  @param {String} fsPath
 *  @returns {Promise<String|Boolean>}
 */
async function fsBlobDirLatest (fsPath) {
  const listOfDir = []
  try {
    const fsItems = await fsp.readdir(fsPath)

    for (const fsItem of fsItems) {
      const fsItemPath = path.join(fsPath, fsItem)
      const fsItemStat = await fsp.stat(fsItemPath)
      fsItemStat.isDirectory() && listOfDir.push({
        fsItem,
        fsItemStat
      })
    }
  } catch (err) {
    if (err.code === 'ENOENT') { return false }
    throw err
  }

  if (listOfDir.length < 1) {
    return false
  }

  if (listOfDir.length > 1) {
    listOfDir.sort((a, b) => {
      return b.fsItemStat.birthtime.getTime() - a.fsItemStat.birthtime.getTime()
    })
  }

  return listOfDir[0].fsItem
}
