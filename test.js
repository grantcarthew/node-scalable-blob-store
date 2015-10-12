var crispyStream = require('crispy-stream');
var opts = {
  blobStoreRoot: '/home/grant/blobs',
  dirDepth: 3,
  dirWidth: 3
}
var repeat = 500
var sbs = require('./index').create(opts)

var blobItem = '/04df9f3b-87e0-4636-ac85-1bbbb4dd95d6/7f66e07c-b59d-4ef6-8eb9-1eb5b41fc14a/1f2ab679-aeec-4c54-a00b-04c0a31510b1/2296b3a9-26c0-400d-8684-70c91a0ddf31'
var fullBlobPath
sbs.stat(blobItem).then((stat) => {
  console.dir(stat);
}).catch((err) => {
  console.error(err)
})
return

// sbs._linearBlobKey().then((result) => {
//   console.log('=============result=============');
//   console.log(result);
// })
// return

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


function tester(repeat) {
  var i = repeat
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
      // console.log(data + ' ' + i);
      //console.log('[Before Delay] index: ' + i);
    }).then(() => {
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
tester(repeat)
