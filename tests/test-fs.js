const cuid = require('cuid');
const utils = require('./test-utils');
const bulkCreate = require('./bulk-create');
const options = {
  blobStoreRoot: utils.genBlobStoreRoot('test-fs'),
  idFunction: cuid,
  dirDepth: 3,
  dirWidth: 1000,
};
const repeat = 10000;
const line = '='.repeat(100);

async function main() {
  const result = await bulkCreate(options, repeat);
  console.log('Test complete.');
  console.log(line);
  console.dir(result);
  console.log(line);
  console.log(`Please remove ${options.blobStoreRoot} manually.`);
  console.log(line);
}

console.log(line);
console.log('Testing scalable-blob-store with the following options:');
console.log('blobStoreRoot: ' + options.blobStoreRoot);
console.log('idFunction: ulid');
console.log('dirDepth: ' + options.dirDepth);
console.log('dirWidth: ' + options.dirWidth);
console.log('repeat: ' + repeat);
console.log();
console.log('Beginning test...');
console.log(line);
main();
