var uuid = require('node-uuid')
var blobs = require('fs-blob-store')
var path = require('path')
var fs = require('fs')

module.exports = BlobStore

function BlobStore(storeRoot, dirDepth) {
  if (!(this instanceof BlobStore)) { return new BlobStore(storeRoot, dirDepth) }
  this.storeRoot = storeRoot
  this.dirDepth = dirDepth
  this.currentDirPath = []
  this.fsBlobStore = blobs(storeRoot)
}

BlobStore.prototype.write = (stream) => {

}

BlobStore.prototype.read = (blobPath) => {

}

BlobStore.prototype.delete = (blobPath) => {

}

BlobStore.prototype._getLatestDir = (parentPath) => {
  return new Promise((resolve, reject) => {



    function getSubDirs(dir, cb) {
    fs.readdir(dir, function(err, files) {
        var dirs = [],
        filePath,
        checkDirectory = function(err, stat) {
            if(stat.isDirectory()) {
                dirs.push(files[i]);
            }
            if(i + 1 === l) { // last record
                cb(dirs);
            }
        };

        for(var i=0, l=files.length; i<l; i++) {
            if(files[i][0] !== '.') { // ignore hidden
                filePath = dir+'/'+files[i];
                fs.stat(filePath, checkDirectory);
            }
        }
    });
}



  }).then((files) => {
    console.dir(files);
    files.map((file) => {
      return fs.stat(file)
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
