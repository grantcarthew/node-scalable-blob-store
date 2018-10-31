const path = require('path')
const fsp = require('fs').promises

module.exports = fsBlobFileList

/**
 * Returns a list of files located within the blob store directory.
 * Returns an empty array if the directory does not exist.
 *
 * @param {String} blobStoreRoot
 * @param {String} blobDir
 * @returns {Promise<Array>} - The array contains string file names.
 */
async function fsBlobFileList (blobStoreRoot, blobDir) {
  try {
    const fullBlobPath = path.join(blobStoreRoot, blobDir)
    const blobDirItems = await fsp.readdir(fullBlobPath)
    const fileList = []
    for (const fsItem of blobDirItems) {
      const stat = await fsp.stat(path.join(fullBlobPath, fsItem))
      stat.isFile() && fileList.push(fsItem)
    }
    return fileList
  } catch (err) {
    if (err.code === 'ENOENT') { return [] }
    throw err
  }
}
