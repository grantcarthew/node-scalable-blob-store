var mkdirp = require('mkdirp')

module.exports = function (opts) {
  if (typeof opts === 'string') {
    opts = { blobStoreRoot: opts }
  }

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
