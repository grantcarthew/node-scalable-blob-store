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
  var fullPath = ''

  return Promise.resolve(this.currentBlobDir).bind(this).then((blobDir) => {
    if (!blobDir) {
      console.log('[========Building New========]');
      return this._buildBlobDir()
    }
    return
  }).then(() => {
    fullPath = path.join(this.blobStoreRoot,
                         this.currentBlobDir)
    return this._countFiles(fullPath)
  }).then((total) => {
    if (total >= this.dirWidth) {
      return this._buildBlobDir()
    }
  }).then(() => {
    return new Promise((resolve, reject) => {
      var filePath = path.join(this.currentBlobDir, uuid.v4())
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
  return new Promise((resolve, reject) => {
    try {
      var readStream = this.fsBlobStore.createReadStream({
        key: blobPath
      })
      resolve(readStream)
    } catch (err) {
      reject(err)
    }
  }).bind(this)
}

BlobStore.prototype.remove = function(blobPath) {
  return new Promise((resolve, reject) => {
    this.fsBlobStore.remove({
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
  var loopIndex = this.dirDepth
  var blobDir = '/'

  return new Promise((resolve, reject) => {
    function recurse(nextPath) {
      console.log('=================== Recurse Start ' + loopIndex + ' nextPath ====================');
      console.log(nextPath);
      console.log('==================== currentBlobDir ======================');
      console.log(this.currentBlobDir);
      this._latestDir(nextPath).then((dir) => {
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
          return this._countDirs(countDirsPath).then((dirCount) => {
            state.dirCount = dirCount
            return state
          })
        } else {
          var countFilesPath = path.join(nextPath, state.dir)
          return this._countFiles(countFilesPath).then((fileCount) => {
            state.fileCount = fileCount
            return state
          })
        }
        return state
      }).then((state) => {

        console.log('===================== State with Dir and File Count =========================');
        console.log(state);

        if (!state.isNewDir &&
            state.dirCount >= this.dirWidth ||
            state.fileCount >= this.dirWidth) {
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
          this.currentBlobDir = blobDir
          resolve(this.currentBlobDir)
        } else {
          loopIndex--
          var nextFullPath = path.join(this.blobStoreRoot, blobDir)
          recurse.call(this, nextFullPath)
        }
      }).catch((err) => {
        reject(err)
      })
    }

    // Initiate Recursion
    recurse.call(this, this.blobStoreRoot)
  }).bind(this)
}

BlobStore.prototype._trimedLinearBlobKey = function() {
  return this._latestLinearBlobKey().bind(this).then((linearBlobKey) => {
    var fullBlobDir = path.join(this.blobStoreRoot, linearBlobKey)
    return this._countFiles(fullBlobDir).then((fileCount) => {
      if (fileCount >= this.dirWidth) {
        return path.dirname(linearBlobKey)
      }
      return linearBlobKey
    })
  }).then((linearBlobKey) => {
    var keyLength = linearBlobKey.split('/').length - 1
    var blobKey = ''
    console.log(keyLength);
    if (keyLength === this.dirDepth) {
      return linearBlobKey
    }

    return new Promise((resolve, reject) => {
      function trimKey(nextKey) {
        this._countDirs(nextKey).then((dirCount) => {
          if (dirCount >= this.dirWidth) {
            blobKey = path.dirname(nextKey)
            trimKey.call(this, blobKey)
          }
          resolve(nextKey)
        }).bind(this)
      }

      // Initiate Recursion
      trimKey.call(this, linearBlobKey)
    }).bind(this)

    return linearBlobKey
  })
}

BlobStore.prototype._latestLinearBlobKey = function() {
  var loopIndex = this.dirDepth
  var blobKey = '/'

  return new Promise((resolve, reject) => {
    function recurse(nextKey) {
      this._latestDir(nextKey).then((dir) => {
        if (!dir) {
          return uuid.v4()
        }
        return dir
      }).then((dir) => {
        blobKey = path.join(blobKey, dir)

        if (loopIndex === 1) {
          this.currentBlobDir = blobKey
          resolve(this.currentBlobDir)
        } else {
          loopIndex--
          var nextFullPath = path.join(this.blobStoreRoot, blobKey)
          recurse.call(this, nextFullPath)
        }
      }).catch((err) => {
        reject(err)
      })
    }

    // Initiate Recursion
    recurse.call(this, this.blobStoreRoot)
  }).bind(this)
}

BlobStore.prototype._latestDir = function(parentDir) {
  // console.log('[_latestDir]');
  return this._dir(parentDir).bind(this).then((fsItems) => {
    return this._filterDirs(parentDir, fsItems)
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
  // console.log('[_countDirs]');
  return this._dir(parentDir).bind(this).then((fsItems) => {
    return this._filterDirs(parentDir, fsItems)
  }).then((dirs) => {
    return dirs.length
  })
}

BlobStore.prototype._countFiles = function(parentDir) {
  // console.log('[_countFiles]');
  return this._dir(parentDir).bind(this).then((fsItems) => {
    return this._filterFiles(parentDir, fsItems)
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

BlobStore.prototype._filterDirs = function(parentDir, fsItems) {
  return this._filterFsItems(parentDir, fsItems, true)
}

BlobStore.prototype._filterFiles = function(parentDir, fsItems) {
  return this._filterFsItems(parentDir, fsItems, false)
}

BlobStore.prototype._filterFsItems = function(parentDir, fsItems, onDirs) {
  // console.log('[_filterFsItems]');
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
