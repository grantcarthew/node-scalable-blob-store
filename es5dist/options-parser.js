'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var mkdirp = require('mkdirp');

module.exports = function (opts) {
  if (!opts) {
    throw new Error('scalable-blob-store options required.');
  }

  if ((typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) !== 'object') {
    throw new Error('scalable-blob-store options object required.');
  }

  if (!opts.blobStoreRoot) {
    throw new Error('The blobStoreRoot directory option must be set.');
  }

  if (!opts.idType) {
    throw new Error('The idType option must be set.');
  }

  if (opts.idType.toUpperCase() !== 'uuid'.toUpperCase() && opts.idType.toUpperCase() !== 'cuid'.toUpperCase()) {
    throw new Error('The idType option is invalid.');
  }

  mkdirp.sync(opts.blobStoreRoot);
  if (opts.dirDepth < 1 || opts.dirDepth > 10) {
    throw new Error('The dirDepth option must be between 1 and 10.');
  }
  if (!opts.dirDepth) {
    opts.dirDepth = 3;
  }
  if (!opts.dirWidth) {
    opts.dirWidth = 1000;
  }
  return opts;
};