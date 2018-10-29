const fs = require('fs')
const fsp = fs.promises
const path = require('path')
global.Promise = require('bluebird')

// Internal Modules
const optionsParser = require('./options-parser')
const blobDirBuild = require('./blob-dir-build')
const fsBlobFileList = require('./fs-blob-file-list')

// Internal State Symbols
const _state = Symbol('BlobStoreState')
const _currentBlobDir = Symbol('CurrentBlobDir')

/**
 * The createWriteStream return type.
 * @typedef BlobWriteStream
 * @property {Object} writeStream - The Nodejs Writable Stream.
 * @property {String} blobPath - The blobStoreRoot releative blob path.
 */

/**
 * The main blob store class.
 *
 * @class BlobStore
 */
class BlobStore {
  constructor (options) {
    this[_state] = optionsParser(options)
    this[_currentBlobDir] = false
  }

  /**
   * Returns the root filesystem path used by the Blob Store.
   *
   * @readonly
   * @returns {String}
   * @memberof BlobStore
   */
  get blobStoreRoot () {
    return this[_state].blobStoreRoot
  }

  /**
   * Returns the idFunction used to generate the Blob Store directory and file names.
   * This is a convenience method to allow the consumer to generate IDs.
   *
   * @readonly
   * @returns {Function}
   * @memberof BlobStore
   */
  get idFunction () {
    return this[_state].idFunction
  }

  /**
   * Returns the configured dirWidth value which represents the maximum
   * number of files or directories allowed within a directory.
   *
   * @readonly
   * @returns {Number}
   * @memberof BlobStore
   */
  get dirWidth () {
    return this[_state].dirWidth
  }

  /**
   * Returns the configured dirDepth value which represents the maximum
   * depth of directories to save blob files.
   *
   * @readonly
   * @returns {Number}
   * @memberof BlobStore
   */
  get dirDepth () {
    return this[_state].dirDepth
  }

  /**
   * Returns the current directory being used for blob storage.
   * The full blob paths require the blobStoreRoot to be prefixed.
   *
   * @returns {Promise<String>}
   * @memberof BlobStore
   */
  async getCurrentBlobDir () {
    let blobDir = this[_currentBlobDir] || await blobDirBuild(this[_state])
    const blobDirFiles = await fsBlobFileList(this[_state].blobStoreRoot, blobDir)
    if (blobDirFiles.length >= this[_state].dirWidth) {
      blobDir = await blobDirBuild(this[_state])
    }
    this[_currentBlobDir] = blobDir
    return this[_currentBlobDir]
  }

  /**
   * Creates a new file system stream to a blob file.
   * Includes the writable stream and the relative blob path
   * in the returned object.
   *
   * @returns {Promise<BlobWriteStream>}
   * @memberof BlobStore
   */
  async createWriteStream () {
    const currentBlobDir = await this.getCurrentBlobDir()
    const blobPath = path.join(currentBlobDir, this[_state].idFunction())
    const filePath = path.join(this[_state].blobStoreRoot, blobPath)
    const writeStream = fs.createWriteStream(filePath)
    return {
      blobPath,
      writeStream
    }
  }

  /**
   * Writes the data to a new blob file returning the relative blob path.
   *
   * @param {String|Buffer} data
   * @param {Object} writeOptions - Standard fs.writeFile options object.
   * @returns {Promise<String>}
   * @memberof BlobStore
   */
  async writeFile (data, writeOptions) {
    const currentBlobDir = await this.getCurrentBlobDir()
    const blobPath = path.join(currentBlobDir, this[_state].idFunction())
    const filePath = path.join(this[_state].blobStoreRoot, blobPath)
    await fsp.writeFile(filePath, data, writeOptions)
    return blobPath
  }

  /**
   * Appends data to the end of the file located at the blobPath.
   *
   * @param {String} blobPath
   * @param {String|Buffer} data
   * @param {Object} appendOptions - Standard fs.appendFile options object.
   * @returns {Promise<void>}
   * @memberof BlobStore
   */
  async appendFile (blobPath, data, appendOptions) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fsp.appendFile(fullFilePath, data, appendOptions)
  }

  /**
   * Copies the file located at the blobPath to a new blobPath.
   *
   * @param {String} blobPath
   * @param {Object} flags - Standard fs.copy flags object which modifies the copy operation.
   * @returns {Promise<String>}
   * @memberof BlobStore
   */
  async copyFile (blobPath, flags) {
    const currentBlobDir = await this.getCurrentBlobDir()
    const fullSrcPath = path.join(this[_state].blobStoreRoot, blobPath)
    const dstBlobPath = path.join(currentBlobDir, this[_state].idFunction())
    const dstFilePath = path.join(this[_state].blobStoreRoot, dstBlobPath)
    await fsp.copyFile(fullSrcPath, dstFilePath, flags)
    return dstBlobPath
  }

  /**
   * Returns a Readable Stream for the file located at the relative blobPath.
   *
   * @param {String} blobPath
   * @returns {Object} - Standard Node.js readable stream.
   * @memberof BlobStore
   */
  createReadStream (blobPath) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fs.createReadStream(fullFilePath)
  }

  /**
   * Reads the file located at the relative blobPath returning the contents.
   *
   * @param {String} blobPath
   * @param {Object} [readOptions={}] - Defaults to encoding equal to 'utf8'.
   * @returns
   * @memberof BlobStore
   */
  readFile (blobPath, readOptions = {}) {
    readOptions.encoding = readOptions.encoding || 'utf8'
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fsp.readFile(fullFilePath, readOptions)
  }

  /**
   * Returns the full file system file path for the relative blobPath.
   *
   * @param {String} blobPath
   * @param {Object} realPathOptions - Standard fs.realpath options object.
   * @returns {Promise<String>} - Full path to the blobPath file.
   * @memberof BlobStore
   */
  realPath (blobPath, realPathOptions) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fsp.realpath(fullFilePath, realPathOptions)
  }

  /**
   * Tests for the existance of a file located at the relative blobPath.
   *
   * @param {String} blobPath
   * @returns {Promise<Boolean>} - True if the file exists. False otherwise.
   * @memberof BlobStore
   */
  async exists (blobPath) {
    try {
      const stat = await this.stat(blobPath)
      return !!stat
    } catch (err) {
      if (err.code !== 'ENOENT') { throw err }
    }
    return false
  }

  /**
   * Deletes the file located at the relative blobPath.
   * Succeeds if the file exists or not.
   *
   * @param {String} blobPath
   * @returns {Promise<void>}
   * @memberof BlobStore
   */
  async remove (blobPath) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    try {
      await fsp.unlink(fullFilePath)
    } catch (err) {
      if (err.code !== 'ENOENT') { throw err }
    }
  }

  /**
   * Returns the standard file system stat object for the file located
   * at the relative blobPath.
   *
   * @param {String} blobPath
   * @returns {Object}
   * @memberof BlobStore
   */
  stat (blobPath) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fsp.stat(fullFilePath)
  }
}

module.exports = BlobStore
