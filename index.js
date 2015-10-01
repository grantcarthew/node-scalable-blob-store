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
  console.log('[constructor]');
  this.storeRoot = storeRoot
  this.dirDepth = dirDepth
  this.currentDirPath = []
  this.fsBlobStore = blobs(storeRoot)
  // console.dir(this)
}

BlobStore.prototype.write = (stream) => {

}

BlobStore.prototype.read = (blobPath) => {

}

BlobStore.prototype.delete = (blobPath) => {

}

BlobStore.prototype._buildChildPath = function(parentPath) {
  console.log('[_buildChildPath]');
  var self = this
  var loopIndex = self.dirDepth
  var childPath = '/'

  return new Promise((resolve, reject) => {

    function recurse(nextPath) {
      console.log('[recurse]' + childPath);
      console.log(nextPath);

      self._latestDir(nextPath).then((dir) => {
        console.log(dir);
        if (dir) {
          childPath = path.join(childPath, dir)
        } else {
          childPath = path.join(childPath, uuid.v4())
        }

        if (loopIndex === 1) {
          resolve(childPath)
        } else {
          loopIndex--
          console.log('[before recurse]');
          console.log(loopIndex)
          console.log(parentPath);
          console.log(childPath);
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




  return this._nextChildPart(parentPath, this.dirDepth)

}

BlobStore.prototype._dir = function(parentPath) {
  console.log('[_dir]');
  return new Promise((resolve, reject) => {
    fs.readdir(parentPath, function(err, fsItems) {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve()
        } else {
          return reject(err)
        }
      }
      return resolve(fsItems)
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
  }).catch((err) => {
    if (err.code === 'ENOENT') {
      return false
    } else {
      return err
    }
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
  console.log('[_filterDirs]');
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return this._fsItemInfo(parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return item.stat.isDirectory()
    })
  })
}

BlobStore.prototype._filterFiles = function(parentPath, fsItems) {
  if (!fsItems || fsItems.length === 0) {
    return []
  }
  return this._fsItemInfo(parentPath, fsItems).then((fsItems) => {
    return fsItems.filter((item) => {
      return !item.stat.isDirectory()
    })
  })
}
