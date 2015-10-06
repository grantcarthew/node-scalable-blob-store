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


function tester() {
  var i = 50
  var input = 'The Quick Brown Fox Jumped Over The Lazy Dog';
  function recurse() {
    if (i < 1) { return }
    var readStream = crispyStream.createReadStream(input);
    sbs.write(readStream).then((blobPath) => {
      console.log(blobPath);
      i--
      recurse()
    })
  }
  recurse()
}
console.log('[Calling Tester]');
tester()
