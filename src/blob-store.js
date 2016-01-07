var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var uuid = require('node-uuid')
var fsBlobStoreFactory = require('fs-blob-store')
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
  var parsedOpts = options(opts)
  this.blobStoreRoot = parsedOpts.blobStoreRoot
  this.dirDepth = parsedOpts.dirDepth
  this.dirWidth = parsedOpts.dirWidth

  this.currentBlobPath = false
  this.fsBlobStore = fsBlobStoreFactory(this.blobStoreRoot)
}

BlobStore.prototype.createWriteStream = function () {
  var self = this

  return Promise.resolve(this.currentBlobPath).then((blobPath) => {
    if (!blobPath) {
      return blobPathBuild(self.blobStoreRoot, self.dirDepth, self.dirWidth)
    }
    return blobPath
  }).then((blobPath) => {
    return fsItemCount(self.blobStoreRoot, blobPath, false).then((total) => {
      if (total >= self.dirWidth) {
        return blobPathBuild(self.blobStoreRoot, self.dirDepth, self.dirWidth)
      }
      return blobPath
    })
  }).then((blobPath) => {
    self.currentBlobPath = blobPath
    return new Promise((resolve, reject) => {
      var filePath = path.join(blobPath, uuid.v4())
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
  var fullBlobPath = path.join(this.blobStoreRoot, blobPath)
  return new Promise((resolve, reject) => {
    fs.stat(fullBlobPath, (err, stat) => {
      if (err) {
        return reject(err)
      }
      resolve(stat)
    })
  })
}
