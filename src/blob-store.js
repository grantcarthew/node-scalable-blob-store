const fs = require('fs')
const fsp = fs.promises
const path = require('path')

// Internal Modules
const optionsParser = require('./options-parser')
const blobPathBuild = require('./blob-path-build')
const fsBlobFileList = require('./fs-blob-file-list')

// Internal State Symbols
const _state = Symbol('BlobStoreState')
const _currentBlobDir = Symbol('CurrentBlobDir')

class BlobStore {
  constructor (options) {
    this[_state] = optionsParser(options)
    this[_currentBlobDir] = false
  }

  get blobStoreRoot () {
    return this[_state].blobStoreRoot
  }

  get idFunction () {
    return this[_state].idFunction
  }

  get dirWidth () {
    return this[_state].dirWidth
  }

  get dirDepth () {
    return this[_state].dirDepth
  }

  async getCurrentBlobDir () {
    let blobPath = this[_currentBlobDir] || await blobPathBuild(this[_state])
    const blobPathFiles = await fsBlobFileList(this[_state].blobStoreRoot, blobPath)
    if (blobPathFiles.length >= this[_state].dirWidth) {
      blobPath = await blobPathBuild(this[_state])
    }
    this[_currentBlobDir] = blobPath
    return this[_currentBlobDir]
  }

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

  async writeFile (data, writeOptions) {
    const currentBlobDir = await this.getCurrentBlobDir()
    const blobPath = path.join(currentBlobDir, this[_state].idFunction())
    const filePath = path.join(this[_state].blobStoreRoot, blobPath)
    await fsp.writeFile(filePath, data, writeOptions)
    return blobPath
  }

  async appendFile (blobPath, data, appendOptions) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fsp.appendFile(fullFilePath, data, appendOptions)
  }

  async copyFile (blobPath, flags) {
    const currentBlobDir = await this.getCurrentBlobDir()
    const fullSrcPath = path.join(this[_state].blobStoreRoot, blobPath)
    const dstBlobPath = path.join(currentBlobDir, this[_state].idFunction())
    const dstFilePath = path.join(this[_state].blobStoreRoot, dstBlobPath)
    await fsp.copyFile(fullSrcPath, dstFilePath, flags)
    return dstBlobPath
  }

  createReadStream (blobPath) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fs.createReadStream(fullFilePath)
  }

  readFile (blobPath, readOptions = {}) {
    readOptions.encoding = readOptions.encoding || 'utf8'
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fsp.readFile(fullFilePath, readOptions)
  }

  realPath (blobPath, realPathOptions) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fsp.realpath(fullFilePath, realPathOptions)
  }

  async exists (blobPath) {
    try {
      const stat = await this.stat(blobPath)
      return !!stat
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
    return false
  }

  async remove (blobPath) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    try {
      await fsp.unlink(fullFilePath)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
  }

  stat (blobPath) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fsp.stat(fullFilePath)
  }
}

module.exports = BlobStore
