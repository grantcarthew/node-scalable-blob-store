const mkdirp = require('mkdirp')

module.exports = function (options) {
  if (!options || typeof options !== 'object') {
    throw new Error('scalable-blob-store options object required.')
  }

  if (!options.blobStoreRoot) {
    throw new Error('The blobStoreRoot directory option is required.')
  }

  if (!options.idType) {
    throw new Error('The idType option is required.')
  }

  if (options.idType.toUpperCase() !== 'uuid'.toUpperCase() &&
      options.idType.toUpperCase() !== 'cuid'.toUpperCase()) {
    throw new Error('The idType option is invalid.')
  }

  if (options.dirDepth < 1 || options.dirDepth > 10) {
    throw new Error('The dirDepth option must be between 1 and 10.')
  }

  options.dirDepth = options.dirDepth || 3
  options.dirWidth = options.dirWidth || 1000

  mkdirp.sync(options.blobStoreRoot)

  return options
}
