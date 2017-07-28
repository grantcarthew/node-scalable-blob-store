/*
  This test-runner script has been created due to the mock-fs file system module
  used for running the unit tests. Intermittently the mock-fs replacement of the
  node fs methods prevents the tests from requiring the other modules.
  I am attempting to fix this by adding this script to use the synchronous
  require functions of node to run the tests in order and synchronously.
 */
const optionsParserSpec = require('./options-parser.spec')
const idGeneratorSpec = require('./id-generator.spec')
const idValidatorSpec = require('./id-validator.spec')
const fsBlobItemListSpec = require('./fs-blob-item-list.spec')
const fsBlobDirLatestSpec = require('./fs-blob-dir-latest.spec')
const fsBlobDirLatestFullDepthSpec = require('./fs-blob-dir-latest-full-depth.spec')
const blobPathBuildSpec = require('./blob-path-build.spec')
const blobStoreApiPromiseSpec = require('./blob-store-api-promise.spec')
const blobStoreApiCallbackSpec = require('./blob-store-api-callback.spec')
const blobStoreMultiSpec = require('./blob-store-multi.spec')
const blobStoreBulkSpec = require('./blob-store-bulk.spec')

async function main () {
  await optionsParserSpec()
  await idGeneratorSpec()
  await idValidatorSpec()
  await fsBlobItemListSpec()
  await fsBlobDirLatestSpec()
  await fsBlobDirLatestFullDepthSpec()
  await blobPathBuildSpec()
  await blobStoreApiPromiseSpec()
  await blobStoreApiCallbackSpec()
  await blobStoreMultiSpec()
  await blobStoreBulkSpec()
}

main()
