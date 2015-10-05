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

console.log('=======');
console.dir(sbs.write)
console.log('=======');
var input = 'pipe this';
var pipable = crispyStream.createReadStream(input);

console.log('=======');
for (var i = 0; i < 2500; i++) {
  console.log(i);
  sbs.write().then((ws) => {
    pipable.pipe(ws.writeStream);
  })
}
