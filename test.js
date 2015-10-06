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
  var i = 10
  var input = 'pipe this';
  var pipable = crispyStream.createReadStream(input);
  function recurse() {
    if (i < 1) { return }
    sbs.write().then((ws) => {
      pipable.pipe(ws.writeStream);
      i--
      recurse()
    })
  }
  recurse()
}
console.log('[Calling Tester]');
tester()
