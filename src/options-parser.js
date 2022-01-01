const fs = require('fs');

module.exports = optionsParser;

/**
 * Tests the options object.
 *
 * @param {Object} options
 * @returns {Object}
 */
function optionsParser(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('scalable-blob-store options object required.');
  }

  if (!options.blobStoreRoot) {
    throw new Error('The blobStoreRoot directory option is required.');
  }

  if (!options.idFunction) {
    throw new Error('The idFunction option is required.');
  }

  if (typeof options.idFunction !== 'function') {
    throw new Error('The idFunction option is must be a function.');
  }

  const testId = options.idFunction();
  if (typeof testId !== 'string') {
    throw new Error('The idFunction option must generate a string.');
  }

  if (options.dirDepth < 1 || options.dirDepth > 10) {
    throw new Error('The dirDepth option must be between 1 and 10.');
  }

  options.dirDepth = options.dirDepth || 3;
  options.dirWidth = options.dirWidth || 1000;

  fs.mkdirSync(options.blobStoreRoot, { recursive: true });

  return options;
}
