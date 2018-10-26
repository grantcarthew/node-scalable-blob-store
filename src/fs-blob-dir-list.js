const path = require('path')
const fsp = require('fs').promises

module.exports = fsBlobDirList

async function fsBlobDirList (blobStoreRoot, blobPath) {
  try {
    const fullBlobPath = path.join(blobStoreRoot, blobPath)
    const blobPathItems = await fsp.readdir(fullBlobPath)
    const blobPathDirs = []
    for (const fsItem of blobPathItems) {
      const stat = await fsp.stat(path.join(fullBlobPath, fsItem))
      stat.isDirectory() && blobPathDirs.push(fsItem)
    }
    return blobPathDirs
  } catch (err) {
    if (err.code === 'ENOENT') { return [] }
    throw err
  }
}
