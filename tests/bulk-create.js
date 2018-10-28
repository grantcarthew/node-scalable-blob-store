const BlobStore = require('../src/blob-store')
const del = require('del')
const streamToString = require('./test-streamtostring')
const crispyStream = require('crispy-stream')
const data = 'The quick brown fox jumps over the lazy dog'
const nodeDir = require('node-dir')

module.exports = bulkCreate

async function bulkCreate (options, numberOfFiles) {
  const bs = new BlobStore(options)
  await del(options.blobStoreRoot, { force: true })

  const startTime = new Date()
  let i = numberOfFiles
  let readTotal = 0
  let lastBlobPath = ''
  let testResults = await recurse()
  return testResults

  async function recurse () {
    if (i < 1) {
      const endTime = new Date()
      return dirSummary(options, readTotal, lastBlobPath, startTime, endTime)
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
    lastBlobPath = blobPath
    i--
    return recurse()
  }
}

function dirSummary (options, readTotal, lastBlobPath, startTime, endTime) {
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
        'totalBytes': readTotal,
        lastBlobPath
      }
      return resolve(result)
    })
  })
}
