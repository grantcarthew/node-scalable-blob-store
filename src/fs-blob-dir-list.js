const path = require('path')
const fsp = require('fs').promises

module.exports = fsBlobDirList

/**
 * Returns a list of directories located within the blob store directory.
 * Returns an empty array if the directory does not exist.
 *
 * @param {String} blobStoreRoot
 * @param {String} blobDir
 * @returns {Promise<Array>} - The array contains string directory names.
 */
async function fsBlobDirList (blobStoreRoot, blobDir) {
  try {
    const fullBlobPath = path.join(blobStoreRoot, blobDir)
    const blobDirItems = await fsp.readdir(fullBlobPath)
    const dirList = []
    for (const fsItem of blobDirItems) {
      const stat = await fsp.stat(path.join(fullBlobPath, fsItem))
      stat.isDirectory() && dirList.push(fsItem)
    }
    return dirList
  } catch (err) {
    if (err.code === 'ENOENT') { return [] }
    throw err
  }
}
