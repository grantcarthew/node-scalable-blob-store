'use strict';

var Promise = require('bluebird');
var path = require('path');
var mkdirp = require('mkdirp');
var fsBlobDirLatest = require('./fs-blob-dir-latest');

module.exports = function (state) {
  var loopIndex = state.dirDepth;
  var blobPath = '/';

  return new Promise(function (resolve, reject) {
    function buildPath(nextPath) {
      var fullNextPath = path.join(state.blobStoreRoot, nextPath);
      return fsBlobDirLatest(fullNextPath, state.validateId).then(function (dir) {
        if (!dir) {
          return state.newId();
        }
        return dir;
      }).then(function (dir) {
        blobPath = path.join(blobPath, dir);

        if (loopIndex === 1) {
          mkdirp(path.join(state.blobStoreRoot, blobPath));
          resolve(blobPath);
          return null;
        } else {
          loopIndex--;
          buildPath(blobPath);
        }
      }).catch(function (err) {
        reject(err);
        return null;
      });
    }

    // Initiate Recursion
    buildPath(blobPath);
  });
};