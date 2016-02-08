'use strict';

var path = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

module.exports = function (fsPath, validateId, onDirOrFile) {
  return fs.readdirAsync(fsPath).filter(function (fsItem) {
    var fsItemPath = path.join(fsPath, fsItem);
    return fs.statAsync(fsItemPath).then(function (stat) {
      return onDirOrFile ? stat.isDirectory() : stat.isFile();
    }).catch(function (err) {
      console.error(err);
      return false;
    });
  }).filter(function (fsItemName) {
    return validateId(fsItemName);
  }).catch(function (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  });
};