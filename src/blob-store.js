const fs = require('fs')
const fsp = fs.promises
const path = require('path')

// Internal Modules
const optionsParser = require('./options-parser')
const blobPathBuild = require('./blob-path-build')
const fsBlobFileList = require('./fs-blob-file-list')

// Internal State Symbols
const _state = Symbol('BlobStoreState')
const _currentBlobPath = Symbol('CurrentBlobPath')

class BlobStore {
  constructor (options) {
    this[_state] = optionsParser(options)
    this[_currentBlobPath] = false
  }

  async createWriteStream () {
    let blobPath = this[_currentBlobPath] || await blobPathBuild(this[_state])
    const blobPathFiles = await fsBlobFileList(this[_state].blobStoreRoot, blobPath)
    if (blobPathFiles.length >= this[_state].dirWidth) {
      blobPath = await blobPathBuild(this[_state])
    }
    this[_currentBlobPath] = blobPath
    blobPath = path.join(blobPath, this[_state].idFunction())
    const filePath = path.join(this[_state].blobStoreRoot, blobPath)
    const writeStream = fs.createWriteStream(filePath)
    return {
      blobPath,
      writeStream
    }
  }

  createReadStream (blobPath) {
    const fullFilePath = path.join(this[_state].blobStoreRoot, blobPath)
    return fs.createReadStream(fullFilePath)
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
