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

BlobStore.prototype._buildChildPath = function(parentPath) {
  var workingDir = this.storeRoot
  var childPath = ''
  for (var i of this.dirDepth) {
    var dir = this._latestDir(workingDir)
    if (!dir) {
      childPath = '/' + uuid.v4()
    } else {
      childPath = '/' + dir
    }
  }
  return childPath
}

BlobStore.prototype._nextChildPath = function(parentPath) {
  var self = this
  return self._latestDir(parentPath).then((dir) => {
    if (!dir) {
      return '/' + uuid.v4()
    } else {
      return '/' + dir
    }
  })
  // var get = async(function*() {
  // var left = yield readJSON('left.json')
  // var right = yield readJSON('right.json')
  // return {left: left, right: right}
  // })
}

BlobStore.prototype._dir = function(parentPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(parentPath, function(err, fsItems) {
      if (err) {
        if (err.code === 'ENOENT') {
          return []
        } else {
          return reject(err)
        }
      }
      resolve(fsItems)
    })
  })
}

BlobStore.prototype._fsItemInfo = function(parentPath, fsItems) {
  return new Promise((resolve, reject) => {
    var stats = []
    fsItems.forEach((item, index) => {
      fullPath = path.join(parentPath, item)
      fs.stat(fullPath, (err, stat) => {
        if (err) {
          if (err.code === 'ENOENT') {
            return
          } else {
            return reject(err)
          }
        }
        stats.push({
          name: item,
          stat: stat
        })
        if (index === fsItems.length - 1) {
          resolve(stats)
        }
      })
    })
  })
}

BlobStore.prototype._latestDir = function(parentPath) {
  var self = this
  return self._dir(parentPath).then((fsItems) => {
    return self._filterDirs(parentPath, fsItems)
  }).then((dirs) => {
    dirs.sort((a, b) => {
      return b.stat.birthtime.getTime() - a.stat.birthtime.getTime()
    })
    return dirs[0].name
  })
}

BlobStore.prototype._countDirs = function(parentPath) {
  var self = this
  return self._dir(parentPath).then((fsItems) => {
    return self._filterDirs(parentPath, fsItems)
  }).then((dirs) => {
    return dirs.length
  })
}

BlobStore.prototype._countFiles = function(parentPath) {
  var self = this
  return self._dir(parentPath).then((fsItems) => {
    return self._filterDirs(parentPath, fsItems)
  }).then((dirs) => {
    return dirs.length
  })
}

BlobStore.prototype._filterDirs = function(parentPath, fsItems) {
  return this._fsItemInfo(parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory()
    })
  })
}

BlobStore.prototype._filterFiles = function(parentPath, fsItems) {
  return this._fsItemInfo(parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return !item.stat.isDirectory()
    })
  })
}
