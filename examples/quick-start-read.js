const os = require('os')
const path = require('path')
const ulid = require('ulid').ulid
// const BlobStore = require('scalable-blob-store')
const BlobStore = require('../')
const data = 'The quick brown fox jumps over the lazy dog.'
const line = '='.repeat(80)

const options = {
  blobStoreRoot: os.tmpdir() + '/blobs', // Change this!
  idFunction: ulid,
  dirDepth: 3,
  dirWidth: 1000
}

// Creating the blobStore Object
const blobStore = new BlobStore(options)

// Calling the quick start async function
quickStartRead(data)

async function quickStartRead (writeData) {
  console.log(line)
  console.log('Quick Start Read Example')
  console.log(line)

  console.log('We need a blob file to read.')
  const blobPath = await blobStore.writeFile(writeData)
  console.log('Following is the blobPath for the file we will read:')
  console.log(blobPath)

  // blobPath is not a full file system path
  // The full path will be the blobStoreRoot + blobPath
  // blobPath: /01CTZBM6BA090XZNRCWBXFA25R/01CTZBM6BBXXTNWM7YZBMFBC3W/01CTZBM6BBD3F8KZQ14Q79ZNKM/01CTZBM6BCEMJ4FXVZKHQ3FAJZ/01CTZBM6BD74MC5HVQ39PFGP0J

  console.log('Here is the full path for the file:')
  console.log(path.join(options.blobStoreRoot, blobPath))

  // Reading Example
  console.log('Lets read the file using blobStore.createReadStream.')
  console.log('Following this log line we should see the data:')
  const readStream = blobStore.createReadStream(blobPath)
  readStream.on('error', err => {
    console.error(err)
  })

  // Pipe the file to the console.
  readStream.pipe(process.stdout)

  // A small delay...
  await new Promise(resolve => { setTimeout(resolve, 400) })
  console.log() // Adding a new line to the console

  // We can also use the readFile method
  const content = await blobStore.readFile(blobPath)
  console.log('Following is the data from the readFile method:')
  console.log(content)
  console.log(line)
}
