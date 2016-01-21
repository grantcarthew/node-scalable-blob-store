const os = require('os')
const crispyStream = require('crispy-stream')
const opts = {
  blobStoreRoot: os.homedir() + '/blobs',
  idType: 'cuid',
  dirDepth: 3,
  dirWidth: 1000
}
const repeat = 10000
const sbs = require('../index').create(opts)

function streamToString (stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })
    stream.on('end', () => {
      resolve(chunks.join(''))
    })
  })
}

function tester (repeat) {
  console.log('Write/Read tests starting...')
  console.time('Duration')
  var i = repeat
  var input = 'The quick brown fox jumped over the lazy dog'
  var readTotal = 0

  function recurse () {
    if (i < 1) {
      console.log('Read Total: ', readTotal)
      console.timeEnd('Duration')
      console.log('Test complete.')
      return
    }
    var readStream = crispyStream.createReadStream(input)

    sbs.createWriteStream().then((result) => {
      return new Promise((resolve, reject) => {
        result.writeStream.on('finish', () => {
          resolve(result.blobPath)
        })
        result.writeStream.on('error', reject)
        readStream.pipe(result.writeStream)
      })
    }).then((blobPath) => {
      return sbs.createReadStream(blobPath)
    }).then((rs) => {
      return streamToString(rs)
    }).then((data) => {
      readTotal += data.length
      i--
      recurse()
      return
    }).catch((err) => {
      console.error(err)
      console.error(err.stack)
    })
  }
  recurse()
}

console.log('scalable-blob-store testing')
console.log('Options:', opts)
tester(repeat)