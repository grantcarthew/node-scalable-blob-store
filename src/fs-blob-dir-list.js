const path = require('path')
const fsp = require('fs').promises

module.exports = fsBlobDirList

/**
 * Returns a list of directories located within the blob store directory.
 * Returns an empty array if the directory does not exist.
 *
 * @param {String} blobStoreRoot
 * @param {String} blobPath
 * @returns {Promise<Array>} - The array contains string directory names.
 */
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
