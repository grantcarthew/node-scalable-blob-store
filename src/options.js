var mkdirp = require('mkdirp')

module.exports = function (opts) {
  if (!opts) {
    throw new Error('scalable-blob-store options required.')
  }

  if (!opts.blobStoreRoot) {
    throw new Error('The blobStoreRoot directory option must be set.')
  }

  if (!opts.idType) {
    throw new Error('The idType option must be set.')
  }

  if (opts.idType !== 'uuid' && opts.idType !== 'cuid') {
    throw new Error('The idType option is invalid.')
  }

  mkdirp.sync(opts.blobStoreRoot)
  if (!opts.dirDepth) { opts.dirDepth = 3 }
  if (opts.dirDepth < 1 || opts.dirDepth > 10) {
    throw new Error('The dirDepth option must be between 1 and 10.')
  }
  if (!opts.dirWidth) { opts.dirWidth = 1000 }
  return opts
}
