const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const fsBlobStoreFactory = require('fs-blob-store')
Promise.promisify(fs.stat)

// Internal Modules
const optionsParser = require('./options-parser')
const fsBlobItemList = require('./fs-blob-item-list')
const blobPathBuild = require('./blob-path-build')
const idGenerator = require('./id-generator')
const idValidator = require('./id-validator')

exports.create = BlobStore

function BlobStore (opts) {
  if (!(this instanceof BlobStore)) {
    return new BlobStore(opts)
  }
  this.state = optionsParser(opts)
  this.state.newId = idGenerator(this.state.idType)
  this.state.validateId = idValidator(this.state.idType)
  this.currentBlobPath = false
  this.fsBlobStore = fsBlobStoreFactory(this.state.blobStoreRoot)
  Promise.promisifyAll(Object.getPrototypeOf(this.fsBlobStore))
}

BlobStore.prototype.createWriteStream = function (callback) {
  callback = callback || function () {}
  var self = this

  return new Promise((resolve, reject) => {
    return Promise.resolve(this.currentBlobPath).then((blobPath) => {
      if (!blobPath) { return blobPathBuild(self.state) }
      return blobPath
    }).then((blobPath) => {
      var fullBlobPath = path.join(self.state.blobStoreRoot, blobPath)
      return fsBlobItemList(fullBlobPath, self.state.validateId, false)
      .then((blobFileItems) => {
        return blobFileItems.length
      }).then((blobFileCount) => {
        if (blobFileCount >= self.state.dirWidth) {
          return blobPathBuild(self.state)
        }
        return blobPath
      })
    }).then((blobPath) => {
      self.currentBlobPath = blobPath
      var filePath = path.join(blobPath, self.state.newId())
      var writeStream = self.fsBlobStore.createWriteStream({
        key: filePath
      })
      let blobData = {
        blobPath: filePath,
        writeStream: writeStream
      }
      resolve(blobData)
      return callback(null, blobData)
    })
  })
}

BlobStore.prototype.createReadStream = function (blobPath) {
  return this.fsBlobStore.createReadStream({
    key: blobPath
  })
}

BlobStore.prototype.exists = function (blobPath, callback) {
  callback = callback || function () {}
  return new Promise((resolve, reject) => {
    this.fsBlobStore.exists({ key: blobPath }, (err, exists) => {
      if (err) {
        reject(err)
        return callback(err)
      }
      resolve(exists)
      return callback(null, exists)
    })
  })
}

BlobStore.prototype.remove = function (blobPath, callback) {
  callback = callback || function () {}
  return new Promise((resolve, reject) => {
    this.fsBlobStore.remove({ key: blobPath }, (err, result) => {
      if (err) {
        reject(err)
        return callback(err)
      }
      resolve(result)
      return callback(null, result)
    })
  })
}

BlobStore.prototype.stat = function (blobPath, callback) {
  var fullBlobPath = path.join(this.state.blobStoreRoot, blobPath)
  callback = callback || function () {}
  return new Promise((resolve, reject) => {
    fs.stat(fullBlobPath, (err, result) => {
      if (err) {
        reject(err)
        return callback(err)
      }
      resolve(result)
      return callback(null, result)
    })
  })
}
