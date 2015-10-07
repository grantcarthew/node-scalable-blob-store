var crispyStream = require('crispy-stream');
var opts = {
  blobStoreRoot: '/home/grant/blobs',
  dirDepth: 10,
  dirWidth: 3
}
var sbs = require('./index').create(opts)

// sbs._latestDir('/home/grant/app-contacts').then((result) => {
//   console.log(result);
// })


// sbs._buildChildPath('/home/grant/app-contacts').then((result) => {
//   console.log(result);
// })
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


function tester() {
  var i = 5000
  var input = 'The quick brown fox jumped over the lazy dog';
  function recurse() {
    if (i < 1) { return }
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
      console.log(data + ' ' + i);
      i--
      recurse()
      return
    // }).then(() => {
    //   return sbs.remove(currentBlobPath)
    }).catch((err) => {
      console.error(err)
    })
  }
  recurse()
}
console.log('[Calling Tester]');
tester()
