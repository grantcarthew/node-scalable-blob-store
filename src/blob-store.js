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

class BlobStore {
  constructor (options) {
    optionsParser(options)
  }
}

module.exports = BlobStore

function BlobStoreOld (opts) {
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
  if (callback) {
    CreateWriteStreamPromise.call(this).then(function (data) {
      callback(null, data)
    }, function (err) {
      callback(err)
    })
  } else {
    return CreateWriteStreamPromise.call(this)
  }
}

function CreateWriteStreamPromise () {
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
    let blobData = {
      blobPath: filePath,
      writeStream: writeStream
    }
    return blobData
  })
}

BlobStore.prototype.createReadStream = function (blobPath) {
  return this.fsBlobStore.createReadStream({
    key: blobPath
  })
}

BlobStore.prototype.exists = function (blobPath, callback) {
  if (callback) {
    this.fsBlobStore.exists({ key: blobPath }, (err, exists) => {
      if (err) {
        return callback(err)
      }
      return callback(null, exists)
    })
  } else {
    return new Promise((resolve, reject) => {
      this.fsBlobStore.exists({ key: blobPath }, (err, exists) => {
        if (err) {
          reject(err)
          return null
        }
        resolve(exists)
        return null
      })
    })
  }
}

BlobStore.prototype.remove = function (blobPath, callback) {
  if (callback) {
    this.fsBlobStore.remove({ key: blobPath }, (err) => {
      if (err) {
        return callback(err)
      }
      return callback()
    })
  } else {
    return new Promise((resolve, reject) => {
      this.fsBlobStore.remove({ key: blobPath }, (err) => {
        if (err) {
          reject(err)
          return null
        }
        resolve()
        return null
      })
    })
  }
}

BlobStore.prototype.stat = function (blobPath, callback) {
  var fullBlobPath = path.join(this.state.blobStoreRoot, blobPath)
  if (callback) {
    fs.stat(fullBlobPath, (err, result) => {
      if (err) { return callback(err) }
      return callback(null, result)
    })
  } else {
    return new Promise((resolve, reject) => {
      fs.stat(fullBlobPath, (err, result) => {
        if (err) {
          reject(err)
          return null
        }
        resolve(result)
        return null
      })
    })
  }
}
