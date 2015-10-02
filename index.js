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
  this.currentChildPath = ''
  this.fsBlobStore = fsBlobStoreFactory(this.opts.blobStoreRoot)
  // console.dir(this)
}

BlobStore.prototype.write = (stream) => {

}

BlobStore.prototype.read = (blobPath) => {

}

BlobStore.prototype.delete = (blobPath) => {

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

BlobStore.prototype._buildChildPath = function(parentPath) {
  console.log('[_buildChildPath]');
  var self = this
  var loopIndex = self.opts.dirDepth
  var childPath = '/'

  return new Promise((resolve, reject) => {

    function recurse(nextPath) {
      console.log('[recurse]' + childPath);
      console.log(nextPath);

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
          return self._coundDirs(data.dir).then((dirCount) => {
            data.dirCount = dirCount
            return data
          })
        }
        return data
      }).then((data) => {
        if (data.dirCount > self.opts.dirWidth) {
          data.dir = uuid.v4()
          data.dirCount = 0
        }
        return data
      }).then((data) => {
        if (loopIndex === 1 && !data.isNewDir) {
          return self._countFiles(data.dir).then((fileCount) => {
            data.fileCount = fileCount
            return data
          })
        }
        return data
      }).then((data) => {
        if (data.fileCount > self.dirWidth) {
          data.dir = uuid.v4()
        }
        return data
      }).then((data) => {
        childPath = path.join(childPath, data.dir)

        if (loopIndex === 1) {
          resolve(childPath)
        } else {
          loopIndex--
          var nextFullPath = path.join(parentPath, childPath)
          recurse(nextFullPath)
        }
      }).catch((err) => {
        console.log(err);
        reject(err)
      })
    }
    recurse(parentPath)



  }).then((result) => {
    console.log('In return then with part following;');
    console.log(result)
    return result
  }).catch((err) => {
    console.error(err)
    console.error(err.stack);
  })




  return this._nextChildPart(parentPath, this.opts.dirDepth)

}

BlobStore.prototype._latestDir = function(parentPath) {
  console.log('[_latestDir]');
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
  console.log('[_countDirs]');
  var self = this
  return self._dir(parentPath).then((fsItems) => {
    return self._filterDirs(parentPath, fsItems)
  }).then((dirs) => {
    return dirs.length
  })
}

BlobStore.prototype._countFiles = function(parentPath) {
  console.log('[_countFiles]');
  var self = this
  return self._dir(parentPath).then((fsItems) => {
    return self._filterFiles(parentPath, fsItems)
  }).then((files) => {
    return files.length
  })
}

BlobStore.prototype._dir = function(parentPath) {
  console.log('[_dir]');
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
  console.log('[_filterFsItems]');
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
