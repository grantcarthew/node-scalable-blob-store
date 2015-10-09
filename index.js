var uuid = require('node-uuid')
var fsBlobStoreFactory = require('fs-blob-store')
var Promise = require('bluebird')
var validator = require('validator')
var mkdirp = require('mkdirp')
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

  this.currentBlobKey = false
  this.fsBlobStore = fsBlobStoreFactory(this.blobStoreRoot)
}

BlobStore.prototype._parseOpts = function(opts) {
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

BlobStore.prototype.write = function(readStream) {
  var self = this
  return Promise.resolve(this.currentBlobKey).then((blobKey) => {
    if (!blobKey) {
      return self._buildBlobKey()
    }
    return blobKey
  }).then((blobKey) => {
    return self._countFiles(blobKey).then((total) => {
      if (total >= self.dirWidth) {
        return self._buildBlobKey()
      }
      return blobKey
    })
  }).then((blobKey) => {
    self.currentBlobKey = blobKey
    return new Promise((resolve, reject) => {
      var filePath = path.join(blobKey, uuid.v4())
      var writeStream = self.fsBlobStore.createWriteStream({
        key: filePath
      })
      readStream.pipe(writeStream)
      writeStream.on('finish', () => {
        resolve(filePath)
      })
      writeStream.on('error', reject)
    })
  })
}

BlobStore.prototype.read = function(blobPath) {
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

BlobStore.prototype._buildBlobKey = function() {
  var self = this
  return this._latestLinearBlobKey().then((linearBlobKey) => {
    return self._countFiles(linearBlobKey).then((fileCount) => {
      if (fileCount >= self.dirWidth) {
        return path.dirname(linearBlobKey)
      }
      return linearBlobKey
    })
  }).then((newBlobKey) => {
    var keyLength = newBlobKey.split('/').length - 1
    if (keyLength === self.dirDepth) {
      return newBlobKey
    }

    return new Promise((resolve, reject) => {

      function trimBlobKey(nextKey) {
        self._countDirs(nextKey).then((dirCount) => {
          if (dirCount < self.dirWidth || nextKey.length === 1) {
            resolve(nextKey)
          } else {
            nextKey = path.dirname(nextKey)
            trimBlobKey(nextKey)
          }
        }).catch((err) => {
          reject(err)
        })
      }

      // Initiate Recursion
      trimBlobKey(newBlobKey)
    })
  }).then((newBlobKey) => {
    var keyLength = newBlobKey.split('/').length - 1
    if (keyLength === self.dirDepth) {
      return newBlobKey
    }
    for (var i = self.dirDepth - keyLength; i > 0; i--) {
      newBlobKey = newBlobKey + '/' + uuid.v4()
    }
    return newBlobKey
  })
}

BlobStore.prototype._latestLinearBlobKey = function() {
  var self = this
  var loopIndex = this.dirDepth
  var blobKey = '/'

  return new Promise((resolve, reject) => {

    function buildKey(nextKey) {
      self._latestDir(nextKey).then((dir) => {
        if (!dir) {
          return uuid.v4()
        }
        return dir
      }).then((dir) => {
        blobKey = path.join(blobKey, dir)

        if (loopIndex === 1) {
          mkdirp(path.join(self.blobStoreRoot, blobKey))
          resolve(blobKey)
        } else {
          loopIndex--
          buildKey(blobKey)
        }
      }).catch((err) => {
        reject(err)
      })
    }

    // Initiate Recursion
    buildKey(blobKey)
  })
}

BlobStore.prototype._latestDir = function(parentKey) {
  var self = this
  return this._dir(parentKey).then((fsItems) => {
    return self._filterUuidDirs(parentKey, fsItems)
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

BlobStore.prototype._countDirs = function(parentKey) {
  var self = this
  return this._dir(parentKey).then((fsItems) => {
    return self._filterUuidDirs(parentKey, fsItems)
  }).then((dirs) => {
    return dirs.length
  })
}

BlobStore.prototype._countFiles = function(parentKey) {
  var self = this
  return this._dir(parentKey).then((fsItems) => {
    return self._filterUuidFiles(parentKey, fsItems)
  }).then((files) => {
    return files.length
  })
}

BlobStore.prototype._dir = function(parentKey) {
  var fullParentPath = path.join(this.blobStoreRoot, parentKey)
  return new Promise((resolve, reject) => {
    fs.readdir(fullParentPath, function(err, fsItems) {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve([])
        } else {
          return reject(err)
        }
      }
      return resolve(fsItems)
    })
  })
}

BlobStore.prototype._filterUuidDirs = function(parentKey, fsItems) {
  return this._filterFsUuidItems(parentKey, fsItems, true)
}

BlobStore.prototype._filterUuidFiles = function(parentKey, fsItems) {
  return this._filterFsUuidItems(parentKey, fsItems, false)
}

BlobStore.prototype._filterFsUuidItems = function(parentKey, fsItems, onDirs) {
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return this._fsItemInfo(parentKey, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory() === onDirs &&
             validator.isUUID(item.name, 4)
    })
  })
}

BlobStore.prototype._fsItemInfo = function(parentKey, fsItems) {
  return new Promise((resolve, reject) => {
    var stats = []
    var fullParentPath = path.join(this.blobStoreRoot, parentKey)
    fsItems.forEach((item, index) => {
      fullPath = path.join(fullParentPath, item)
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
