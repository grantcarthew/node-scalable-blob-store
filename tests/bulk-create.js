const BlobStore = require('../src/blob-store')
const os = require('os')
const fs = require('fs')
const del = require('del')
const ulid = require('ulid').ulid
const streamToString = require('./test-streamtostring')
const crispyStream = require('crispy-stream')
const data = 'The quick brown fox jumps over the lazy dog'
const blobStoreRoot = os.tmpdir() + '/sbs/blob-store-bulk-create'
const nodeDir = require('node-dir')
// const options = {
//   blobStoreRoot,
//   idFunction: ulid,
//   dirDepth: 2,
//   dirWidth: 2
// }

module.exports = bulkCreate

async function bulkCreate (options) {
  const bs = new BlobStore(options)
  await del(blobStoreRoot, { force: true })

  const startTime = new Date()
  let i = 124
  let readTotal = 0
  let testResults = await recurse()
  console.dir(testResults)

  async function recurse () {
    if (i < 1) {
      const endTime = new Date()
      return dirSummary(options, readTotal, startTime, endTime)
    }
    const readStream = crispyStream.createReadStream(data)

    const blobStream = await bs.createWriteStream()
    const blobPath = await new Promise((resolve, reject) => {
      blobStream.writeStream.on('finish', () => {
        resolve(blobStream.blobPath)
      })
      blobStream.writeStream.on('error', reject)
      readStream.pipe(blobStream.writeStream)
    }).catch((err) => {
      console.error(err)
    })
    const rs = bs.createReadStream(blobPath)
    const fileData = await streamToString(rs)
    readTotal += fileData.length
    i--
    return recurse()
  }
}

function dirSummary (options, readTotal, startTime, endTime) {
  return new Promise((resolve, reject) => {
    return nodeDir.paths(options.blobStoreRoot, (err, paths) => {
      if (err) { return reject(err) }
      const runTime = Math.abs(startTime.getTime() - endTime.getTime())
      var result = {
        'blobStoreRoot': options.blobStoreRoot,
        'dirDepth': options.dirDepth,
        'dirWidth': options.dirWidth,
        'runTimeMilliseconds': runTime,
        'totalDirectories': paths.dirs.length,
        'totalFiles': paths.files.length,
        'totalBytes': readTotal
      }
      return resolve(result)
    })
  })
}
