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
}

BlobStore.prototype.createWriteStream = function () {
  var self = this
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
    return {
      blobPath: filePath,
      writeStream: writeStream
    }
  })
}

BlobStore.prototype.createReadStream = function (blobPath) {
  return Promise.resolve(
    this.fsBlobStore.createReadStream({
      key: blobPath
    })
  )
}

BlobStore.prototype.exists = function (blobPath) {
  var self = this
  return new Promise((resolve, reject) => {
    self.fsBlobStore.exists({
      key: blobPath
    }, (err, exists) => {
      if (err) {
        reject(err)
      }
      resolve(exists)
    })
  })
}

BlobStore.prototype.remove = function (blobPath) {
  var self = this
  return new Promise((resolve, reject) => {
    self.fsBlobStore.remove({
      key: blobPath
    }, (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

BlobStore.prototype.stat = function (blobPath) {
  var fullBlobPath = path.join(this.state.blobStoreRoot, blobPath)
  return fs.statAsync(fullBlobPath)
}
