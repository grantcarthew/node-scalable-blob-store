'use strict';

var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

module.exports = function (fsPath, validateId) {
  return fs.readdirAsync(fsPath).map(function (fsItem) {
    var fsItemPath = path.join(fsPath, fsItem);
    return fs.statAsync(fsItemPath).then(function (fsItemStat) {
      return {
        name: fsItem,
        stat: fsItemStat
      };
    });
  }).filter(function (fsUnknownItem) {
    return fsUnknownItem.stat.isDirectory();
  }).filter(function (fsUnvalidatedDirList) {
    return validateId(fsUnvalidatedDirList.name);
  }).then(function (fsBlobDirList) {
    if (!fsBlobDirList || fsBlobDirList.length === 0) {
      return false;
    }
    fsBlobDirList.sort(function (a, b) {
      return b.stat.birthtime.getTime() - a.stat.birthtime.getTime();
    });
    return fsBlobDirList[0].name;
  }).catch(function (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  });
};