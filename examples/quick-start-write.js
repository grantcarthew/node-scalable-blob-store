const os = require('os')
const path = require('path')
const ulid = require('ulid').ulid
const BlobStore = require('scalable-blob-store')
const data = 'The quick brown fox jumps over the lazy dog.'
const line = '='.repeat(80)

const options = {
  blobStoreRoot: os.tmpdir() + '/blobs', // TODO: Change this!
  idFunction: ulid,
  dirDepth: 3,
  dirWidth: 1000
}

// Creating the blobStore Object
const blobStore = new BlobStore(options)

// Calling the quick start async function
quickStartWrite(data)

async function quickStartWrite (writeData) {
  console.log(line)
  console.log('Quick Start Write Example')
  console.log(line)

  console.log('Saving data using blobStore.write:')
  const firstBlobPath = await blobStore.write(writeData)
  console.log('First file is located in the following blobPath:')
  console.log(firstBlobPath)
  console.log('First file full path is:')
  console.log(path.join(options.blobStoreRoot, firstBlobPath))

  // firstBlobPath is not a full file system path
  // The full path will be the blobStoreRoot + blobPath
  // firstBlobPath: /01CTZBM6BA090XZNRCWBXFA25R/01CTZBM6BBXXTNWM7YZBMFBC3W/01CTZBM6BBD3F8KZQ14Q79ZNKM/01CTZBM6BCEMJ4FXVZKHQ3FAJZ/01CTZBM6BD74MC5HVQ39PFGP0J

  // Opening a readStream from the file system for an example to write with
  const fs = require('fs')
  const fullFilePath = path.join(options.blobStoreRoot, firstBlobPath)
  const fsReadStream = await fs.createReadStream(fullFilePath)

  // Writing data using writeStream
  const result = await blobStore.createWriteStream()

  console.log('Following is the object returned from blobStore.createWriteStream:')
  console.dir(result, { depth: 0 })
  // Logs the result object which contains the blobPath and writeStream.
  // Use the writeStream to save your blob.
  // Store the blobPath in your database.
  //
  // result object will be similar to this:
  // {
  //   blobPath: "/01CTZBM6BA090XZNRCWBXFA25R/01CTZBM6BBXXTNWM7YZBMFBC3W/01CTZBM6BBD3F8KZQ14Q79ZNKM/01CTZBM6BCEMJ4FXVZKHQ3FAJZ/01CTZBM6BM53X3XBW7TJR2RBFQ",
  //   writeStream: [WriteStream]
  // }

  await new Promise((resolve, reject) => {
    result.writeStream.on('finish', resolve)
    result.writeStream.on('error', reject)
    fsReadStream.pipe(result.writeStream)
  })

  console.log('As you can see it contains the writeStream and the blobPath.')
  console.log('Save the blobPath for the file into your database:')
  console.log(result.blobPath)

  console.log('We can append data to an existing blob using blobStore.append:')
  await blobStore.append(result.blobPath, ' - New content...')
  const content = await blobStore.read(result.blobPath)
  console.log(content)

  console.log('We can copy a blob to a new blobPath:')
  const newCopyBlobPath = await blobStore.copy(result.blobPath)
  console.log('Here is the blobPath for the new copy:')
  console.log(newCopyBlobPath)
  console.log('And here is the content of the new file:')
  const newCopyContent = await blobStore.read(newCopyBlobPath)
  console.log(newCopyContent)

  console.log(line)
}
