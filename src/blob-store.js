var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var fsBlobStoreFactory = require('fs-blob-store')
const idGenerator = require('./id-generator')
var idValidator = require('./id-validator')
var Promise = require('bluebird')

// Internal Modules
var options = require('./options')
var fsItemCount = require('./fs-item-count')
var blobPathBuild = require('./blob-path-build')

exports.create = BlobStore

function BlobStore (opts) {
  if (!(this instanceof BlobStore)) {
    return new BlobStore(opts)
  }
  this.opts = options(opts)
  this.opts.newId = idGenerator(this.opts.idType)
  this.opts.validateId = idValidator(this.opts.idType)
  this.currentBlobPath = false
  this.fsBlobStore = fsBlobStoreFactory(this.opts.blobStoreRoot)
}

BlobStore.prototype.createWriteStream = function () {
  var self = this

  return Promise.resolve(this.currentBlobPath).then((blobPath) => {
    if (!blobPath) {
      return blobPathBuild(self.opts)
    }
    return blobPath
  }).then((blobPath) => {
    return fsItemCount(self.opts, blobPath, false).then((total) => {
      if (total >= self.opts.dirWidth) {
        return blobPathBuild(self.opts)
      }
      return blobPath
    })
  }).then((blobPath) => {
    self.currentBlobPath = blobPath
    return new Promise((resolve, reject) => {
      var filePath = path.join(blobPath, self.opts.newId())
      var writeStream = self.fsBlobStore.createWriteStream({
        key: filePath
      })
      var result = {
        blobPath: filePath,
        writeStream: writeStream
      }
      resolve(result)
    })
  })
}

BlobStore.prototype.createReadStream = function (blobPath) {
  var self = this
  return new Promise((resolve, reject) => {
    try {
      var readStream = self.fsBlobStore.createReadStream({
        key: blobPath
      })
      resolve(readStream)
    } catch (err) {
      reject(err)
    }
  })
}

BlobStore.prototype.exists = function (blobPath) {
  var self = this
  return new Promise((resolve, reject) => {
    self.fsBlobStore.exists({
      key: blobPath
    }, (err) => {
      if (err) {
        reject(err)
      }
      resolve(true)
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
  var fullBlobPath = path.join(this.opts.blobStoreRoot, blobPath)
  return new Promise((resolve, reject) => {
    fs.stat(fullBlobPath, (err, stat) => {
      if (err) {
        return reject(err)
      }
      resolve(stat)
    })
  })
}
