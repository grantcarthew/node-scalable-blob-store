var uuid = require('node-uuid')
var blobs = require('fs-blob-store')
var Promise = require('bluebird')
var path = require('path')
var fs = require('fs')

module.exports = BlobStore

function BlobStore(storeRoot, dirDepth) {
  if (!(this instanceof BlobStore)) {
    return new BlobStore(storeRoot, dirDepth)
  }
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

BlobStore.prototype._latestDirBackup = (parentPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(parentPath, function(err, files) {
      if (err) {
        return reject(err)
      }
      var dirs = []
      var filePath

      files.forEach((file, index) => {
        filePath = path.join(parentPath, file)
        fs.stat(filePath, (err, stat) => {
          if (stat.isDirectory()) {
            dirs.push({
              name: file,
              created: stat.birthtime.getTime()
            })
          }
          if (index === files.length - 1) {
            dirs.sort((a, b) => {
              return parseInt(b.created) - parseInt(a.created)
            })
            resolve(dirs[0].name)
          }
        })
      })
    })
  })
}

BlobStore.prototype._latestDir = function(parentPath) {
  return new Promise((resolve, reject) => {
    var self = this
    fs.readdir(parentPath, function(err, fsItems) {
      if (err) {
        return reject(err)
      }
      resolve(self._filterDir(parentPath, fsItems))
    })
  }).then((dirs) => {
    dirs.sort((a, b) => {
      return parseInt(b.created) - parseInt(a.created)
    })
    return dirs[0].name
  })
}

BlobStore.prototype._countDir = function(parentPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(parentPath, function(err, files) {
      if (err) {
        return reject(err)
      }
      var dirs = []
      var filePath

      files.forEach((file, index) => {
        filePath = path.join(parentPath, file)
        fs.stat(filePath, (err, stat) => {
          if (stat.isDirectory()) {
            dirs.push({
              name: file,
              created: stat.birthtime.getTime()
            })
          }
          if (index === files.length - 1) {
            dirs.sort((a, b) => {
              return parseInt(b.created) - parseInt(a.created)
            })
            resolve(dirs[0].name)
          }
        })
      })
    })
  })
}

BlobStore.prototype._filterDir = function(parentPath, itemArray) {
  return new Promise((resolve, reject) => {
    var self = this
    var dirs = []
    itemArray.forEach((item, index) => {
      fullPath = path.join(parentPath, item)
      fs.stat(fullPath, (err, stat) => {
        if (err) {
          return reject(err)
        }
        if (stat.isDirectory()) {
          dirs.push({
            name: item,
            created: stat.birthtime.getTime()
          })
        }
        if (index === itemArray.length - 1) {
          resolve(dirs)
        }
      })
    })
  })
}

BlobStore.prototype._createUuidDir = function(path) {
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
