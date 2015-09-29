var uuid = require('node-uuid')
var blobs = require('fs-blob-store')
var path = require('path')
var fs = require('fs')

module.exports = BlobStore

function BlobStore(storeRoot, dirDepth) {
  if (!(this instanceof BlobStore)) { return new BlobStore(dir) }
  this.storeRoot = storeRoot
  this.dirDepth = depth
  this.currentDirPath = []
  this.fsBlobStore = blobs(storePath)
}

BlobStore.prototype.write((stream) => {

})

BlogStore.prototype.read((blobPath) => {

})

BlobStore.prototype.delete((blobPath) => {

})

BlobStore.prototype._getLatestDir = (parentPath) => {
  return new Promise((resolve, reject) => {



    fs.readdir(parentPath, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files)
      }
    })



  })
}

BlobStore.prototype._createUuidDir = (path) => {
  return new Promise((resolve, reject) => {
    var dirName = uuid.v4();
    fs.mkdir(path, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
