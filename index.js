var uuid = require('node-uuid')
var fsBlobStoreFactory = require('fs-blob-store')
var Promise = require('bluebird')
var validator = require('validator')
var mkdirp = require('mkdirp')
var stream = require('stream')
var path = require('path')
var fs = require('fs')

exports.create = BlobStore

function BlobStore(opts) {
  if (!(this instanceof BlobStore)) {
    return new BlobStore(opts)
  }
  var parsedOpts = this._parseOpts(opts)
  this.blobStoreRoot = parsedOpts.blobStoreRoot
  this.dirDepth = parsedOpts.dirDepth
  this.dirWidth = parsedOpts.dirWidth

  this.currentBlobPath = false
  this.fsBlobStore = fsBlobStoreFactory(this.blobStoreRoot)
}

BlobStore.prototype._parseOpts = function(opts) {
  if (typeof opts === 'string') {
    opts = { blobStoreRoot: opts }
  }

  if (!opts || !opts.blobStoreRoot) {
    throw new Error('The blobStoreRoot directory must be set.')
  }

  mkdirp.sync(opts.blobStoreRoot)
  if (!opts.dirDepth) { opts.dirDepth = 3 }
  if (opts.dirDepth < 1 || opts.dirDepth > 10) {
    throw new Error('The dirDepth option must be between 1 and 10.')
  }
  if (!opts.dirWidth) { opts.dirWidth = 1000 }
  return opts
}

BlobStore.prototype.createWriteStream = function() {
  var self = this

  return Promise.resolve(this.currentBlobPath).then((blobPath) => {
    if (!blobPath) {
      return self._buildBlobPath()
    }
    return blobPath
  }).then((blobPath) => {
    return self._countFiles(blobPath).then((total) => {
      if (total >= self.dirWidth) {
        return self._buildBlobPath()
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

BlobStore.prototype.createReadStream = function(blobPath) {
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

BlobStore.prototype.exists = function(blobPath) {
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

BlobStore.prototype.remove = function(blobPath) {
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

BlobStore.prototype.stat = function(blobPath) {
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

BlobStore.prototype._buildBlobPath = function() {
  var self = this
  return this._latestlinearBlobPath().then((linearBlobPath) => {
    return self._countFiles(linearBlobPath).then((fileCount) => {
      if (fileCount >= self.dirWidth) {
        return path.dirname(linearBlobPath)
      }
      return linearBlobPath
    })
  }).then((newBlobPath) => {
    var blobPathUuidCount = newBlobPath.split('/').length - 1
    if (blobPathUuidCount === self.dirDepth) {
      return newBlobPath
    }

    return new Promise((resolve, reject) => {

      function trimBlobPath(nextPath) {
        self._countDirs(nextPath).then((dirCount) => {
          if (dirCount < self.dirWidth || nextPath.length === 1) {
            resolve(nextPath)
          } else {
            nextPath = path.dirname(nextPath)
            trimBlobPath(nextPath)
          }
        }).catch((err) => {
          reject(err)
        })
      }

      // Initiate Recursion
      trimBlobPath(newBlobPath)
    })
  }).then((newBlobPath) => {
    var blobPathUuidCount = newBlobPath.split('/').length - 1
    if (blobPathUuidCount === self.dirDepth) {
      return newBlobPath
    }
    for (var i = self.dirDepth - blobPathUuidCount; i > 0; i--) {
      newBlobPath = newBlobPath + '/' + uuid.v4()
    }
    return newBlobPath
  })
}

BlobStore.prototype._latestlinearBlobPath = function() {
  var self = this
  var loopIndex = this.dirDepth
  var blobPath = '/'

  return new Promise((resolve, reject) => {

    function buildPath(nextPath) {
      self._latestDir(nextPath).then((dir) => {
        if (!dir) {
          return uuid.v4()
        }
        return dir
      }).then((dir) => {
        blobPath = path.join(blobPath, dir)

        if (loopIndex === 1) {
          mkdirp(path.join(self.blobStoreRoot, blobPath))
          resolve(blobPath)
        } else {
          loopIndex--
          buildPath(blobPath)
        }
      }).catch((err) => {
        reject(err)
      })
    }

    // Initiate Recursion
    buildPath(blobPath)
  })
}

BlobStore.prototype._latestDir = function(parentPath) {
  var self = this
  return this._dir(parentPath).then((fsItems) => {
    return self._filterUuidDirs(parentPath, fsItems)
  }).then((dirs) => {
    if (!dirs || dirs.length === 0) {
      return false
    }
    dirs.sort((a, b) => {
      return b.stat.birthtime.getTime() - a.stat.birthtime.getTime()
    })
    return dirs[0].name
  })
}

BlobStore.prototype._countDirs = function(parentPath) {
  var self = this
  return this._dir(parentPath).then((fsItems) => {
    return self._filterUuidDirs(parentPath, fsItems)
  }).then((dirs) => {
    return dirs.length
  })
}

BlobStore.prototype._countFiles = function(parentPath) {
  var self = this
  return this._dir(parentPath).then((fsItems) => {
    return self._filterUuidFiles(parentPath, fsItems)
  }).then((files) => {
    return files.length
  })
}

BlobStore.prototype._dir = function(parentPath) {
  var fullParentPath = path.join(this.blobStoreRoot, parentPath)
  return new Promise((resolve, reject) => {
    fs.readdir(fullParentPath, function(err, fsItems) {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve([])
        }
        return reject(err)
      }
      return resolve(fsItems)
    })
  })
}

BlobStore.prototype._filterUuidDirs = function(parentPath, fsItems) {
  return this._filterFsUuidItems(parentPath, fsItems, true)
}

BlobStore.prototype._filterUuidFiles = function(parentPath, fsItems) {
  return this._filterFsUuidItems(parentPath, fsItems, false)
}

BlobStore.prototype._filterFsUuidItems = function(parentPath, fsItems, onDirs) {
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return this._fsItemInfo(parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory() === onDirs &&
             validator.isUUID(item.name, 4)
    })
  })
}

BlobStore.prototype._fsItemInfo = function(parentPath, fsItems) {
  return new Promise((resolve, reject) => {
    var stats = []
    var fullParentPath = path.join(this.blobStoreRoot, parentPath)
    fsItems.forEach((item, index) => {
      fullPath = path.join(fullParentPath, item)
      fs.stat(fullPath, (err, stat) => {
        if (err) {
          if (err.code === 'ENOENT') {
            return
          }
          return reject(err)
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
