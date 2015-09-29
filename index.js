var blobs = require('fs-blob-store')
var path = require('path')

module.exports = BlobStore

function BlobStore(storeRoot, dirDepth) {
  if (!(this instanceof BlobStore)) { return new BlobStore(dir) }
  this.storeRoot = storeRoot
  this.dirDepth = depth
  this.fsBlobStore = blobs(storePath)
}

BlobStore.prototype.write((stream) => {

})

BlogStore.prototype.read((blobPath) => {

})

BlobStore.prototype.delete((blobPath) => {

})
