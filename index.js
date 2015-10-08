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

  this.currentBlobDir = false
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
  // console.log('[write]');
  var self = this
  var fullPath = ''

  return Promise.resolve(self.currentBlobDir).then((blobDir) => {
    if (!blobDir) {
      console.log('[========Building New========]');
      return self._buildBlobDir()
    }
    return
  }).then(() => {
    fullPath = path.join(self.blobStoreRoot,
                         self.currentBlobDir)
    return self._countFiles(fullPath)
  }).then((total) => {
    if (total >= self.dirWidth) {
      return self._buildBlobDir()
    }
  }).then(() => {
    return new Promise((resolve, reject) => {
      var filePath = path.join(self.currentBlobDir, uuid.v4())
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

BlobStore.prototype._buildBlobDir = function() {
  // console.log('[_buildBlobDir]');
  var self = this
  var loopIndex = this.dirDepth
  var blobDir = '/'

  return new Promise((resolve, reject) => {
    function recurse(nextPath) {
      console.log('=================== Recurse Start ' + loopIndex + ' nextPath ====================');
      console.log(nextPath);
      console.log('==================== currentBlobDir ======================');
      console.log(self.currentBlobDir);
      self._latestDir(nextPath).then((dir) => {
        var state = {
          isNewDir: false,
          dirCount: 0,
          fileCount: 0
        }
        if (dir) {
          console.log('================ Latest Is Valid =====================');
          console.log(dir);

          state.dir = dir
        } else {
          state.dir = uuid.v4()
          state.isNewDir = true
          console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Latest Not Valid New Dir @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
          console.log(state.dir);
        }
        return state
      }).then((state) => {
        if (loopIndex > 1 && !state.isNewDir) {
          var countDirsPath = path.join(nextPath, state.dir)
          return self._countDirs(countDirsPath).then((dirCount) => {
            state.dirCount = dirCount
            return state
          })
        } else {
          var countFilesPath = path.join(nextPath, state.dir)
          return self._countFiles(countFilesPath).then((fileCount) => {
            state.fileCount = fileCount
            return state
          })
        }
        return state
      }).then((state) => {

        console.log('===================== State with Dir and File Count =========================');
        console.log(state);

        if (!state.isNewDir &&
            state.dirCount >= self.dirWidth ||
            state.fileCount >= self.dirWidth) {
          console.log('################### Dir or File > Width ##########################');
          state.dir = uuid.v4()
          state.isNewDir = true
          state.dirCount = 0
          state.fileCount = 0
          console.log('===================== New Dir =========================');
          console.log(state.dir);
        }
        return state
      }).then((state) => {
        blobDir = path.join(blobDir, state.dir)

        if (loopIndex === 1) {
          self.currentBlobDir = blobDir
          resolve(self.currentBlobDir)
        } else {
          loopIndex--
          var nextFullPath = path.join(self.blobStoreRoot, blobDir)
          recurse(nextFullPath)
        }
      }).catch((err) => {
        reject(err)
      })
    }

    // Initiate Recursion
    recurse(self.blobStoreRoot)
  })
}

BlobStore.prototype._trimedLinearBlobKey = function() {
  var self = this
  return this._latestLinearBlobKey().then((linearBlobKey) => {
    var fullBlobDir = path.join(self.blobStoreRoot, linearBlobKey)
    return self._countFiles(fullBlobDir).then((fileCount) => {
      if (fileCount >= self.dirWidth) {
        return path.dirname(linearBlobKey)
      }
      return linearBlobKey
    })
  }).then((linearBlobKey) => {
    var keyLength = linearBlobKey.split('/').length - 1
    var blobKey = ''
    console.log('keyLength1: ' + keyLength);
    if (keyLength === self.dirDepth) {
      return linearBlobKey
    }

    return new Promise((resolve, reject) => {
      function trimKey(nextKey) {
        console.log('nextKey: ' + nextKey);
        var countDirsPath = path.join(self.blobStoreRoot, nextKey)
        self._countDirs(countDirsPath).then((dirCount) => {
          console.log('dirCount: ' + dirCount);
          if (dirCount >= self.dirWidth) {
            blobKey = path.dirname(nextKey)
            trimKey(blobKey)
          }
          resolve(nextKey)
        }).catch((err) => {
          reject(err)
        })
      }

      // Initiate Recursion
      trimKey(linearBlobKey)
    })

    return linearBlobKey
  }).then((linearBlobKey) => {
    var keyLength = linearBlobKey.split('/').length - 1
    if (keyLength === self.dirDepth) {
      return linearBlobKey
    }
    console.log('keyLength2: ' + keyLength);
    console.log('linearBlobKey: ' + linearBlobKey);
    for (var i = self.dirDepth - keyLength; i > 0; i--) {
      console.log('i is: ' + i);
      linearBlobKey = linearBlobKey + '/' + uuid.v4()
    }
    return linearBlobKey
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
          resolve(blobKey)
        } else {
          loopIndex--
          var nextFullPath = path.join(self.blobStoreRoot, blobKey)
          buildKey(nextFullPath)
        }
      }).catch((err) => {
        reject(err)
      })
    }

    // Initiate Recursion
    buildKey(self.blobStoreRoot)
  })
}

BlobStore.prototype._latestDir = function(parentDir) {
  // console.log('[_latestDir]');
  var self = this

  return this._dir(parentDir).then((fsItems) => {
    return self._filterUuidDirs(parentDir, fsItems)
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

BlobStore.prototype._countDirs = function(parentDir) {
  console.log('[_countDirs]');
  console.log(parentDir);
  var self = this

  return this._dir(parentDir).then((fsItems) => {
    console.log('fsItems from dir: ' + fsItems);
    return self._filterUuidDirs(parentDir, fsItems)
  }).then((dirs) => {
    return dirs.length
  })
}

BlobStore.prototype._countFiles = function(parentDir) {
  // console.log('[_countFiles]');
  var self = this

  return this._dir(parentDir).then((fsItems) => {
    return self._filterUuidFiles(parentDir, fsItems)
  }).then((files) => {
    return files.length
  })
}

BlobStore.prototype._dir = function(parentDir) {
  // console.log('[_dir]');
  return new Promise((resolve, reject) => {
    fs.readdir(parentDir, function(err, fsItems) {
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

BlobStore.prototype._filterUuidDirs = function(parentDir, fsItems) {
  return this._filterFsUuidItems(parentDir, fsItems, true)
}

BlobStore.prototype._filterUuidFiles = function(parentDir, fsItems) {
  return this._filterFsUuidItems(parentDir, fsItems, false)
}

BlobStore.prototype._filterFsUuidItems = function(parentDir, fsItems, onDirs) {
  // console.log('[_filterFsUuidItems]');
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return this._fsItemInfo(parentDir, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory() === onDirs &&
             validator.isUUID(item.name, 4)
    })
  })
}

BlobStore.prototype._fsItemInfo = function(parentDir, fsItems) {
  return new Promise((resolve, reject) => {
    var stats = []
    fsItems.forEach((item, index) => {
      fullPath = path.join(parentDir, item)
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
