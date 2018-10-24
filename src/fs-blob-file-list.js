const path = require('path')
const fsp = require('fs').promises

module.exports = fsBlobFileList

async function fsBlobFileList (blobStoreRoot, blobPath) {
  const fullBlobPath = path.join(blobStoreRoot, blobPath)
  const blobPathItems = await fsp.readdir(fullBlobPath)
  const blobPathFiles = []
  for (const fsItem of blobPathItems) {
    const stat = await fsp.stat(path.join(fullBlobPath, fsItem))
    stat.isFile() && blobPathFiles.push(fsItem)
  }
  return blobPathFiles
}
