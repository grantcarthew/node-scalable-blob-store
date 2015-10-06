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
  this._parseOpts(opts)
  this.currentBlobPath = false
  this.fsBlobStore = fsBlobStoreFactory(this.opts.blobStoreRoot)
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

  this.opts = opts
}

BlobStore.prototype.write = function(readStream) {
  // console.log('[write]');
  var fullPath = ''

  return Promise.resolve(this.currentBlobPath).bind(this).then((blobPath) => {
    if (!blobPath) {
      return this._buildBlobPath()
    }
    return
  }).then(() => {
    fullPath = path.join(this.opts.blobStoreRoot,
                         this.currentBlobPath)
    return this._countFiles(fullPath)
  }).then((total) => {
    if (total >= this.opts.dirWidth) {
      return this._buildBlobPath()
    }
  }).then(() => {
    return new Promise((resolve, reject) => {
      var filePath = path.join(this.currentBlobPath, uuid.v4())
      var writeStream = this.fsBlobStore.createWriteStream({
        key: filePath
      })
      readStream.pipe(writeStream)
      writeStream.on('finish', () => {
        resolve(filePath)
      })
      writeStream.on('error', reject)
    }).bind(this)
  })
}

BlobStore.prototype.read = function(blobPath) {
  var self = this
  return new Promise((resolve, reject) => {
    return self.fsBlobStore.createReadStream({
      key: blobPath
    })
  })
}

BlobStore.prototype.delete = function(blobPath) {
  return new Promise((resolve, reject) => {
    fs.unlink(blobPath, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

BlobStore.prototype._buildBlobPath = function() {
  // console.log('[_buildBlobPath]');
  var self = this
  var loopIndex = self.opts.dirDepth
  var blobPath = '/'

  return new Promise((resolve, reject) => {

    function recurse(nextPath) {
      console.log('[recurse] loopIndex: ' + loopIndex);

      self._latestDir(nextPath).then((dir) => {
        var data = {
          isNewDir: false,
          dirCount: 0,
          fileCount: 0
        }
        if (dir && validator.isUUID(dir, 4)) {
          data.dir = dir
        } else {
          data.dir = uuid.v4()
          data.isNewDir = true
        }
        return data
      }).then((data) => {
        if (loopIndex > 1 && !data.isNewDir) {
          var coundDirsPath = path.join(nextPath, data.dir)
          return self._countDirs(coundDirsPath).then((dirCount) => {
            data.dirCount = dirCount
            return data
          })
        } else {
          var countFilesPath = path.join(nextPath, data.dir)
          return self._countFiles(countFilesPath).then((fileCount) => {
            data.fileCount = fileCount
            return data
          })
        }
        return data
      }).then((data) => {
        console.log('New Dir: ' + data.dirCount + ' ' + data.fileCount);
        if (!data.isNewDir &&
            data.dirCount >= self.opts.dirWidth ||
            data.fileCount >= self.opts.dirWidth) {
          data.dir = uuid.v4()
          data.isNewDir = true
          data.dirCount = 0
          data.fileCount = 0
        }
        return data
      }).then((data) => {
        blobPath = path.join(blobPath, data.dir)

        if (loopIndex === 1) {
          self.currentBlobPath = blobPath
          resolve(self.currentBlobPath)
        } else {
          loopIndex--
          var nextFullPath = path.join(self.opts.blobStoreRoot, blobPath)
          recurse(nextFullPath)
        }
      }).catch((err) => {
        reject(err)
      })
    }

    // Initiate Recursion
    recurse(self.opts.blobStoreRoot)
  })
}

BlobStore.prototype._latestDir = function(parentPath) {
  // console.log('[_latestDir]');
  var self = this
  return self._dir(parentPath).then((fsItems) => {
    return self._filterDirs(parentPath, fsItems)
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
  // console.log('[_countDirs]');
  var self = this
  return self._dir(parentPath).then((fsItems) => {
    return self._filterDirs(parentPath, fsItems)
  }).then((dirs) => {
    return dirs.length
  })
}

BlobStore.prototype._countFiles = function(parentPath) {
  // console.log('[_countFiles]');
  var self = this
  return self._dir(parentPath).then((fsItems) => {
    return self._filterFiles(parentPath, fsItems)
  }).then((files) => {
    return files.length
  })
}

BlobStore.prototype._dir = function(parentPath) {
  // console.log('[_dir]');
  return new Promise((resolve, reject) => {
    fs.readdir(parentPath, function(err, fsItems) {
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

BlobStore.prototype._filterDirs = function(parentPath, fsItems) {
  return this._filterFsItems(parentPath, fsItems, true)
}

BlobStore.prototype._filterFiles = function(parentPath, fsItems) {
  return this._filterFsItems(parentPath, fsItems, false)
}

BlobStore.prototype._filterFsItems = function(parentPath, fsItems, onDirs) {
  // console.log('[_filterFsItems]');
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return this._fsItemInfo(parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory() === onDirs
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
