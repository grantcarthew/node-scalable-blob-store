const os = require('os');
const ulid = require('ulid').ulid;
const BlobStore = require('scalable-blob-store');
const data = 'The quick brown fox jumps over the lazy dog.';
const line = '='.repeat(80);

const options = {
  blobStoreRoot: os.tmpdir() + '/blobs', // TODO: Change this!
  idFunction: ulid,
  dirDepth: 3,
  dirWidth: 1000,
};

// Creating the blobStore Object
const blobStore = new BlobStore(options);

// Calling the quick start async function
quickStartApi(data);

async function quickStartApi(writeData) {
  console.log(line);
  console.log('Quick Start API Example');
  console.log(line);

  // We need a blob file to read
  const blobPath = await blobStore.write(writeData);
  console.log('Following is the blobPath for the file we will read:');
  console.log(blobPath);

  console.log('If we need we can access the blobStoreRoot:');
  console.log(blobStore.blobStoreRoot);

  console.log('The id function is exposed for convenience:');
  console.log(blobStore.idFunction());

  console.log('The dirDepth and dirWidth are also available:');
  console.log(`dirDepth: ${blobStore.dirDepth} dirWidth: ${blobStore.dirWidth}`);

  console.log('If you need to know the current blob directory:');
  const currentBlobDir = await blobStore.getCurrentBlobDir();
  console.log(currentBlobDir);

  console.log('See quick-start-write.js for writing examples.');
  console.log('See quick-start-read.js for reading examples.');

  console.log('Need to know the full file path of a blobPath?');
  const realPath = await blobStore.realPath(blobPath);
  console.log(realPath);

  console.log('File existance test:');
  let exists = await blobStore.exists(blobPath);
  console.log('Does the file exist? ' + exists);

  console.log('File stat data:');
  const stat = await blobStore.stat(blobPath);
  console.dir(stat);

  console.log('Finally we can delete the blob file:');
  await blobStore.remove(blobPath);
  exists = await blobStore.exists(blobPath);
  console.log('Does the file exist? ' + exists);
  console.log(line);
}
