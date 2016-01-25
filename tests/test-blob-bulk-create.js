const Promise = require('bluebird')
const moment = require('moment')
const crispyStream = require('crispy-stream')
const nodeDir = require('node-dir')
const sbsFactory = require('../index')

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

module.exports = function (options, repeat) {
  var blobStore = sbsFactory.create(options)

  return new Promise((resolve, reject) => {
    var startTime = moment()
    var i = repeat
    var input = 'The quick brown fox jumped over the lazy dog'
    var readTotal = 0

    function recurse () {
      if (i < 1) {
        var endTime = moment()
        var runTime = endTime.diff(startTime)

        return nodeDir.paths(options.blobStoreRoot, (err, paths) => {
          if (err) { return reject(err) }
          var result = {
            'blobStoreRoot': options.blobStoreRoot,
            'idType': options.idType,
            'dirDepth': options.dirDepth,
            'dirWidth': options.dirWidth,
            'runTimeMilliseconds': runTime,
            'totalDirectories': paths.dirs.length,
            'totalFiles': paths.files.length,
            'totalBytes': readTotal
          }
          return resolve(result)
        })
      }
      var readStream = crispyStream.createReadStream(input)

      blobStore.createWriteStream().then((result) => {
        return new Promise((resolve, reject) => {
          result.writeStream.on('finish', () => {
            resolve(result.blobPath)
          })
          result.writeStream.on('error', reject)
          readStream.pipe(result.writeStream)
        })
      }).then((blobPath) => {
        return blobStore.createReadStream(blobPath)
      }).then((rs) => {
        return streamToString(rs)
      }).then((data) => {
        readTotal += data.length
        i--
        recurse()
        return
      }).catch((err) => {
        return reject(err)
      })
    }
    recurse()
  })
}
