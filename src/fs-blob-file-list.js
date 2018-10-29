const path = require('path')
const fsp = require('fs').promises

module.exports = fsBlobFileList

/**
 * Returns a list of files located within the blob store directory.
 * Returns an empty array if the directory does not exist.
 *
 * @param {String} blobStoreRoot
 * @param {String} blobPath
 * @returns {Promise<Array>} - The array contains string file names.
 */
async function fsBlobFileList (blobStoreRoot, blobPath) {
  try {
    const fullBlobPath = path.join(blobStoreRoot, blobPath)
    const blobPathItems = await fsp.readdir(fullBlobPath)
    const blobPathFiles = []
    for (const fsItem of blobPathItems) {
      const stat = await fsp.stat(path.join(fullBlobPath, fsItem))
      stat.isFile() && blobPathFiles.push(fsItem)
    }
    return blobPathFiles
  } catch (err) {
    if (err.code === 'ENOENT') { return [] }
    throw err
  }
}
