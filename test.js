var crispyStream = require('crispy-stream');
var opts = {
  blobStoreRoot: '/home/grant/blobs',
  dirDepth: 3,
  dirWidth: 3
}
var repeat = 1000
var sbs = require('./index').create(opts)

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    stream.on('end', () => {
      resolve(chunks.join(''));
    });
  })
}

function writer(repeat) {
  console.log('Write test starting...');
  console.time('Duration')
  var i = repeat
  var input = 'The quick brown fox jumped over the lazy dog';
  function recurse() {
    if (i < 1) {
      console.timeEnd('Duration')
      console.log('Test complete.');
      return
    }
    var readStream = crispyStream.createReadStream(input);
    var currentBlobPath = ''

    sbs.write(readStream).then((blobPath) => {
      currentBlobPath = blobPath
      return blobPath
    }).then((blobPath) => {
      return sbs.read(blobPath)
    }).then((rs) => {
      return streamToString(rs)
    }).then((data) => {
      i--
      recurse()
      return
    }).catch((err) => {
      console.error(err)
    })
  }
  recurse()
}
writer(repeat)
