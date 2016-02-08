const os = require('os')
const options = {
  blobStoreRoot: os.homedir() + '/blobs',
  idType: 'cuid',
  dirDepth: 3,
  dirWidth: 1000
}
const repeat = 10000
const testBlobBulkCreate = require('./test-blob-bulk-create')

testBlobBulkCreate(options, repeat).then((result) => {
  console.dir(result)
}).catch(console.log.bind)
