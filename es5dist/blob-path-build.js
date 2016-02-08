'use strict';

var Promise = require('bluebird');
var path = require('path');
var fsBlobItemList = require('./fs-blob-item-list');
var fsBlobDirLatestFullDepth = require('./fs-blob-dir-latest-full-depth');

module.exports = function (state) {
  return fsBlobDirLatestFullDepth(state).then(function (fullBlobDirPath) {
    var fullPath = path.join(state.blobStoreRoot, fullBlobDirPath);
    return fsBlobItemList(fullPath, state.validateId, false).then(function (blobFileItems) {
      return blobFileItems.length;
    }).then(function (blobFileCount) {
      if (blobFileCount >= state.dirWidth) {
        return path.dirname(fullBlobDirPath);
      }
      return fullBlobDirPath;
    });
  }).then(function (newBlobPath) {
    var blobPathIdCount = newBlobPath.split('/').length - 1;
    if (blobPathIdCount === state.dirDepth) {
      return newBlobPath;
    }

    return new Promise(function (resolve, reject) {
      function trimFullBlobPath(nextPath) {
        return fsBlobItemList(nextPath, state.validateId, true).then(function (blobDirItems) {
          return blobDirItems.length;
        }).then(function (blobDirCount) {
          if (blobDirCount < state.dirWidth || nextPath.length === 1) {
            resolve(nextPath);
          } else {
            nextPath = path.dirname(nextPath);
            trimFullBlobPath(nextPath);
          }
        }).catch(function (err) {
          reject(err);
        });
      }

      // Initiate Recursion
      trimFullBlobPath(newBlobPath);
    });
  }).then(function (newBlobPath) {
    var blobPathIdCount = newBlobPath.split('/').length - 1;
    if (blobPathIdCount === state.dirDepth) {
      return newBlobPath;
    }
    for (var i = state.dirDepth - blobPathIdCount; i > 0; i--) {
      newBlobPath = path.join(newBlobPath, state.newId());
    }
    return newBlobPath;
  });
};