const path = require('path');
const fsp = require('fs').promises;

module.exports = fsBlobDirItemList;

/**
 * Returns a list of files or directories depending on the filesOnly parameter.
 * Returns an empty array if the directory does not exist.
 *
 * @param {String} blobStoreRoot
 * @param {String} blobDir
 * @param {String} filterFunctionName - The name of the stat function for filtering.
 * @returns {Promise<Array>} - The array contains string directory names.
 */
async function fsBlobDirItemList(blobStoreRoot, blobDir, filterFunctionName = 'isFile') {
  try {
    const fullBlobDir = path.join(blobStoreRoot, blobDir);
    const blobDirItems = await fsp.readdir(fullBlobDir);
    const itemList = [];
    for (const fsItem of blobDirItems) {
      const stat = await fsp.stat(path.join(fullBlobDir, fsItem));
      stat[filterFunctionName]() && itemList.push(fsItem);
    }
    return itemList;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}
