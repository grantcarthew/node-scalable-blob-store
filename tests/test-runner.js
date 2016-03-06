/*
  This test-runner script has been created due to the mock-fs file system module
  used for running the unit tests. Intermittently the mock-fs replacement of the
  node fs methods prevents the tests from requiring the other modules.
  I am attempting to fix this by adding this script to use the synchronous
  require functions of node to run the tests in order and synchronously.
 */
require('./options-parser.spec')
require('./id-generator.spec')
require('./id-validator.spec')
require('./fs-blob-item-list.spec')
require('./fs-blob-dir-latest.spec')
require('./fs-blob-dir-latest-full-depth.spec')
require('./blob-path-build.spec')
require('./blob-store-api-promise.spec')
require('./blob-store-api-callback.spec')
require('./blob-store-multi.spec')
require('./blob-store-bulk.spec')
