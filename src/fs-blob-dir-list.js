const path = require('path')
const fsp = require('fs').promises

module.exports = fsBlobDirList

async function fsBlobDirList (state, blobPath) {
  const fullBlobPath = path.join(state.blobStoreRoot, blobPath)
  const blobPathItems = await fsp.readdir(fullBlobPath)
  const blobPathDirs = []
  for (const fsItem of blobPathItems) {
    const stat = await fsp.stat(path.join(fullBlobPath, fsItem))
    stat.isDirectory() && blobPathDirs.push(fsItem)
  }
  return blobPathDirs
}
