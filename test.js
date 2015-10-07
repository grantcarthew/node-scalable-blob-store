var crispyStream = require('crispy-stream');
var opts = {
  blobStoreRoot: '/home/grant/blobs',
  dirDepth: 3,
  dirWidth: 3
}
var sbs = require('./index').create(opts)

// sbs._latestDir('/home/grant/app-contacts').then((result) => {
//   console.log(result);
// })


// sbs._buildChildPath('/home/grant/app-contacts').then((result) => {
//   console.log(result);
// })
function streamToString(stream, cb) {
  const chunks = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  stream.on('end', () => {
    cb(chunks.join(''));
  });
}


function tester() {
  var i = 50
  var input = 'The quick brown fox jumped over the lazy dog';
  function recurse() {
    if (i < 1) { return }
    var readStream = crispyStream.createReadStream(input);
    var writeStream = crispyStream.createWriteStream();
    sbs.write(readStream).then((blobPath) => {
      // console.log('SavePath: ' + blobPath);
      return blobPath
    }).then((blobPath) => {
      return sbs.read(blobPath)
    }).then((rs) => {
      streamToString(rs, (data) => {
        console.log(data);
        i--
        recurse()
      })
    })
  }
  recurse()
}
console.log('[Calling Tester]');
tester()
