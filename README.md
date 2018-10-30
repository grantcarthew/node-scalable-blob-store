# Introduction

`scalable-blob-store` is a file system blob store that is designed to prevent conflicts when used with a distributed file system or storage area network..

<!-- [![Build Status][travisci-image]][travisci-url] -->
[![Maintainability][cc-maintain-badge]][cc-maintain-url]
[![Test Coverage][cc-coverage-badge]][cc-coverage-url]
[![js-standard-style][js-standard-image]][js-standard-url]
[![Patreon Donation][patreon-image]][patreon-url]

[![Mr Blobby][mrblobby-image]][sbs-url]

[![NPM][nodei-npm-image]][nodei-npm-url]

Please __Star__ on GitHub / NPM and __Watch__ for updates.

## Topics

* [Warning](#warning)
* [Features](#features)
* [Quick Start](#quick-start)
* [Rationale](#rationale)
* [Function](#function)
* [Performance](#performance)
* [Installation](#installation)
* [API](#api)
  * [create](#create)
  * [createWriteStream](#createWriteStream)
  * [createReadStream](#createReadStream)
  * [remove](#remove)
  * [stat](#stat)
  * [exists](#exists)
* [Known Issues](#known-issues)
* [Testing](#testing)
* [About the Owner](#about-the-owner)
* [Contributing](#contributing)
* [History](#history)
* [Credits](#credits)
* [License](#license)

## Warning

With the release of `scalable-blob-store` v4 there has seen some major changes.

These changes have introduced some restrictions on the use of the module:

* Requires Node.js v10.12.0 or later.
* Uses Node.js [Stability: 1 - Experimental](https://nodejs.org/api/documentation.html) features. Specifically the [fs.promises](https://nodejs.org/api/fs.html#fs_fs_promises_api) API and the [mkdir recursive](https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options) options.
* The module performance is approximately four times slower than v3.0.9. Most likely this is due to the experimental APIs.
* All callback APIs have been removed.

In time these restrictions will become less of an issue, however for now if you want to use `scalable-blob-store` in production, I suggest you use the old [version 3.0.9 release](https://github.com/grantcarthew/node-scalable-blob-store/releases/tag/v3.0.9).

Please read the [v3.0.9 README](https://github.com/grantcarthew/node-scalable-blob-store/blob/v3.0.9/README.md) document to help you use the older release.

## Features

Version 4 has added a heap of new features.

* Save binary large objects (blobs) locally in a scalable format.
* Only save a relative `blobPath` value to your database.
* Written using modern JavaScript language features.
* No dependencies.
* The unique ID used for the file and directory names is a user supplied function. You can use UUIDs or ULIDs or any other unique ID function.
* The API has been extended:
  * New blob methods including read, write, append, copy, and realPath.
  * All methods return a Promise.
  * BlobStore state values are now exposed as read only properties.
  * New get and set methods for the current blob directory.
  * Still includes the createWriteStream and createReadStream methods among others.
* No longer filters file and directory names to match IDs:
  * This feature means you can change your ID function on an existing blob root directory.
  * Any file or directory name can be used to retrieve blob data.

_Note: see the [restrictions](#warning) above prior to using in production._

## Quick Start

### Installation

```sh
npm install scalable-blob-store --save
```

### Create a writable stream

```js

const os = require('os')
const ulid = require('ulid').ulid // You need a unique ID generator function
const BlobStore = require('scalable-blob-store')

const options = {
  blobStoreRoot: os.tmpdir() + '/blobs', // Change this!
  idFunction: ulid,
  dirDepth: 4,
  dirWidth: 1000
}

// Creating the blobStore Object
const blobStore = new BlobStore(options)
const result = await blobStore.createWriteStream()

console.dir(result)
// Logs the result object which contains the blobPath and writeStream.
// Use the writeStream to save your blob.
// Store the blobPath in your database.
//
// result object will be similar to this:
// {
//   blobPath: "/01CTZRTWMAD153V20K26S4Y0BW/01CTZRTWMBZW4SPR4E5QGGJYSH/01CTZRTWMB3QXZK04SYFY8ZJVR/01CTZS3KJYFPRQ34S3T15Y798S",
//   writeStream: [WriteStream]
// }
//
// In this example the full file path for the blob would be something like this:
// /tmp/blobs/01CTZRTWMAD153V20K26S4Y0BW/01CTZRTWMBZW4SPR4E5QGGJYSH/01CTZRTWMB3QXZK04SYFY8ZJVR/01CTZS3KJYFPRQ34S3T15Y798S
//
// This is based on the blobStoreRoot + blobPath.

```

See the Quick Start example files for more detail:

* [quick-start-write.js](/examples/quick-start-write.js)
* [quick-start-read.js](/examples/quick-start-read.js)
* [quick-start-api.js](/examples/quick-start-api.js)

## Rationale

After researching user file storage, or blob storage, for a web application I was working on I discovered the most common solution used by web developers is to store files using a cloud service provider. After creating an account with such providers as [Amazon S3][amazones3-url], [Google Cloud Storage][googlecloud-url], or [Azure Storage][azurestorage-url], they just stash all their application files and blobs there.

I researched the price of cloud storage and decided I wanted a free local version that would scale if needed.

I looked at a number of existing solutions such as [filestorage][filestorage-url] but was unhappy with the scalability of these solutions. Most are only designed for a single server and would cause write conflicts if a distributed file system, cluster file system like [GlusterFS][glusterfs-url], or a storage area network was used as the backend file system.

On a long car trip I was thinking about a solution for my blob storage and came up with `scalable-blob-store`.

## Function

To achieve scalability on a distributed or replicated file system, `scalable-blob-store` does not use index files or other databases to manage the files on the disk or storage system. Instead, the file system itself is used to find the latest storage path based on the file systems `birthtime` attribute (the directory creation date).

Once the latest path has been determined, the number of files within the directory are counted to ensure it remains under the configured value. This is to prevent disk performance issues when very large numbers of files are stored within a single directory. If the number of items within a directory becomes too large, a new storage path is determined.

Because there are no databases used to manage the files in the root path, it is up to you to maintain the returned `blobPath` value and metadata about the stored files in your own database.

The reason `scalable-blob-store` is scalable is due to the naming of the directories and files within your file system. Every directory and file saved to disk is named by a generated unique id based on a user defined funciton. You could use any unique id generator such as [ULID][ulid-url], [CUID][cuid-url], [UUID v4][uuid-url], or MongoDBs [ObjectIds][objectid-url] just to name a few. Check out my [Awesome Unique ID][awesome-url] repository for more examples. Merging directories between servers or disks should never cause file name collisions.

If a replicated or cluster file system is in use the only conflict that can occur is when one server is reading a file while another is removing the same file. `scalable-blob-store` does not try to manage this conflict, however it will raise the exception.

Below are examples of the directory structure created by `scalable-blob-store`.

Example with CUID directory and file names:

```sh
\blobs\cij50xia200pzzph3we9r62bi // ← Directory    File ↓   
\blobs\cij50xia300q1zph3m4df4ypz\..\cij50xiae00qgzph3i0ms0l2w
```

Example with UUID directory and file names:

```sh
\blobs\846a291f-9864-40bb-aefe-f29bdc73a761 // ← Directory    File ↓   
\blobs\846a291f-9864-40bb-aefe-f29bdc73a761\..\8b86b6fe-6166-424c-aed9-8faf1e62689e
```

`scalable-blob-store` supports configuration options to give you control over the directory and file ids used, depth of the directory structure, and the width of the directories. The default options give 3 directories deep containing 1000 items giving a total storage of one billion files within the directory structure.

Other operational points of interest:

- Files are only stored at the bottom of the directory tree.
- The directory used for writing files is determined by the latest creation time (file system birthtime attribute).
- Once the number of files in a directory reaches the `dirWidth` value, the next directory is created.
- Once the number of directories in any directory reaches the `dirWidth` value, the next parent directory is created.
- If the number of directories in the highest directory, being the blob store root, has reached the `dirWidth` value, the `dirWidth` value is ignored.

## Performance

### Write

With the release of v4 of `scalable-blob-store`, the write performance has dropped significantly. See the [Warning](#warning) topic above for more detial.

### Read

Read performance will be close to, if not the same, as disk speed.

## API

With the update to v4 of `scalable-blob-store` all the BlobStore methods return a Promise. This is perfect for using with the async/await language features.

|API|Parameters|Returns|Type|
|---|----------|-------|----|
|[new BlobStore(options)](#instantiation)|[Options Object](#options)|blobStore Instance|Constructor|
|[blobStore.blobStoreRoot](#blobstoreroot)||`String`|Read Only Property|
|[blobStore.idFunction](#idfunction)||`Function`|Read Only Property|
|[blobStore.dirWidth](#dirwidth)||`Number`|Read Only Property|
|[blobStore.dirDepth](#dirdepth)||`Number`|Read Only Property|
|[blobStore.getCurrentBlobDir()](#getcurrentblobdir)||`Promise<String>`|Method|
|[blobStore.setCurrentBlobDir(blobDir)](#setcurrentblobdir)|`String`|`Promise<undefined>`|Method|
|[blobStore.createWriteStream()](#createwritestream)||`Promise<Object>`|Method|
|[blobStore.write(data, writeOptions)](#write)|`String|Buffer`,`Object`|`Promise<String>`|Method|
|[blobStore.append(blobPath, data, appendOptions)](#append)|`String`,`String|Buffer`,`Object`|`Promise<undefined>`|Method|
|[blobStore.copy(blobPath, flags)](#copy)|`String`,`Number`|`Promise<String>`|Method|
|[blobStore.createReadStream(blobPath)](#createreadstream)|`String`|`Promise<ReadStream>`|Method|
|[blobStore.read(blobPath, readOptions)](#read)|`String`,`Object`|`Promise<data>`|Method|
|[blobStore.realPath(blobPath, realPathOptions)](#realpath)|`String`,`Object`|`Promise<String>`|Method|
|[blobStore.exists(blobPath)](#exists)|`String`|`Promise<Boolean>`|Method|
|[blobStore.remove(blobPath)](#remove)|`String`|`Promise<undefined>`|Method|
|[blobStore.stat(blobPath)](#stat)|`String`|`Promise<Stats>`|Method|

<a name="create" />

### `create(options)`

__Returns__: A new `BlobStore` object to be used to store data.
The `create(options)` function can be called multiple times to create more than one blob store.

Options are passed to the constructor function as a JavaScript `object`.

|Key            |Description                                              |Defaults|
|---------------|---------------------------------------------------------|--------|
|`blobStoreRoot`|Root directory to store blobs                            |Required|
|`idFunction`       |Either 'cuid' or 'uuid' as directory and file names      |Required|
|`dirDepth`     |How deep you want the directories under the root         |3       |
|`dirWidth`     |The maximum number of files or directories in a directory|1000    |

Start by creating the `scalable-blob-store` factory object:

```js
const sbsFactory = require('scalable-blob-store')
```

Create a blob store using an options `object`:

```js
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: 'cuid',
  dirDepth: 4,
  dirWidth: 2000
}

const blobStore = sbsFactory.create(options)
```

Creating multiple blob stores:

```js
const userOptions = {
  blobStoreRoot: '/app/blobs/user',
  idFunction: 'cuid',
  dirDepth: 4,
  dirWidth: 2000
}

const pdfOptions = {
  blobStoreRoot: '/app/blobs/pdf',
  idFunction: 'uuid',
  dirDepth: 2,
  dirWidth: 300
}

const userFileStore = sbsFacorty.create(userOptions)
const pdfDocumentStore = sbsFactory.create(pdfOptions)
```

<a name="createWriteStream" />

### `createWriteStream()`

__Returns__: `object` containing the child path to the file within the blob store root and a [stream.Writable][writestream-url].

Returned Object using CUID as the idFunction:

```js
{
  blobPath: "/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h",
  writeStream: stream.Writable
}
```

Returned Object using UUID as the idFunction:

```js
{
  blobPath: "/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19",
  writeStream: stream.Writable
}
```

Use the `writeStream` to save your blob or file.
The `blobPath` needs to be saved to your database for future access.

Promise example:

```js
const fs = require('fs')
const readStream = fs.createReadStream('/path/to/file')

blobStore.createWriteStream().then(result => {
  console.dir(result)
  // result object will be similar to this:
  // {
  //   blobPath: "/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h",
  //   writeStream: [object Object]
  // }
  // Using a Promise to encapsulate the write asynchronous events.
  return new Promise((resolve, reject) => {
    result.writeStream.on('finish', () => {
        resolve(result.blobPath)
    })
    result.writeStream.on('error', reject)
    readStream.pipe(result.writeStream)
  })
}).then(blobPath => {
  console.log(blobPath)
  // Logs the blobPath. Save this in your database.
}).catch(err => {
  console.error(err)
})
```

Callback example:

```js
const fs = require('fs')
const readStream = fs.createReadStream('/path/to/file')

blobStore.createWriteStream((err, result) => {
  console.dir(result)
  // result object will be similar to this:
  // {
  //   blobPath: "/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h",
  //   writeStream: [object Object]
  // }

  result.writeStream.on('finish', () => {
    console.log(result.blobPath)
    // Logs the blobPath. Save this in your database.
  })
  result.writeStream.on('error', (err) => {
    // Consider removing the empty blob from the file system. Code no included.
    console.error(err)
  })
  readStream.pipe(result.writeStream)
})
```

<a name="createReadStream" />

### `createReadStream(string)`

__Returns__: [`stream.Readable`][readstream-url]

Example:

```js
// Get the blobPath value from your database.
const blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

const readStream = blobStore.createReadStream(blobPath)
readStream.on('error', err => {
  console.error(err)
})
// Blob contents is piped to the console.
readStream.pipe(process.stdout)
```

<a name="remove" />

### `remove(string)`

__Returns__: `undefined` if nothing went wrong or the file did not exist.

Promise example:

```js
// Get the blobPath value from your database.
const blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.remove(blobPath).then(() => {
  console.log('Blob removed successfully.')
}).catch(err => {
  console.error(err)
})
```

Callback example:

```js
// Get the blobPath value from your database.
const blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.remove(blobPath, (err) => {
  if (err) { console.error(err) }
  console.log('Blob removed successfully.')
})
```

<a name="stat" />

### `stat(string)`

__Returns__: `object`

Rather than parse the file system [`stats`][nodefs-url] object, `scalable-blob-store` returns the raw `stats` object.
More stat class details can be found on [Wikipedia][wikistat-url].

Promise example:

```js
// Get the blobPath value from your database.
const blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.stat(blobPath).then(stats => {
  console.dir(stats)
  // Console output will be similar to the following.
  // { dev: 2050,
  //   mode: 33188,
  //   nlink: 1,
  //   uid: 1000,
  //   gid: 1000,
  //   rdev: 0,
  //   blksize: 4096,
  //   ino: 6707277,
  //   size: 44,
  //   blocks: 8,
  //   atime: Mon Oct 12 2015 08:51:29 GMT+1000 (AEST),
  //   mtime: Mon Oct 12 2015 08:51:29 GMT+1000 (AEST),
  //   ctime: Mon Oct 12 2015 08:51:29 GMT+1000 (AEST),
  //   birthtime: Mon Oct 12 2015 08:51:29 GMT+1000 (AEST) }
}).catch(err => {
  console.error(err)
})
```

Callback example:

```js
// Get the blobPath value from your database.
const blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.stat(blobPath, (err, stats) => {
  if (err) { console.error(err) }
  console.dir(stats)
  // Console output will be similar to the following.
  // { dev: 2050,
  //   mode: 33188,
  //   nlink: 1,
  //   uid: 1000,
  //   gid: 1000,
  //   rdev: 0,
  //   blksize: 4096,
  //   ino: 6707277,
  //   size: 44,
  //   blocks: 8,
  //   atime: Mon Oct 12 2015 08:51:29 GMT+1000 (AEST),
  //   mtime: Mon Oct 12 2015 08:51:29 GMT+1000 (AEST),
  //   ctime: Mon Oct 12 2015 08:51:29 GMT+1000 (AEST),
  //   birthtime: Mon Oct 12 2015 08:51:29 GMT+1000 (AEST) }
})
```

<a name="exists" />

### `exists(string)`

__Returns__: `boolean`

`true` if the file exists, otherwise `false`.

Promise example:

```js
// Get the blobPath value from your database.
const blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.exists(blobPath).then(result => {
  console.log(result)
  // Logs 'true' or 'false'.
}).catch(err => {
  console.error(err)
})
```

Callback example:

```js
// Get the blobPath value from your database.
const blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.exists(blobPath, (err, exists) => {
  if (err) { console.error(err) }
  console.log(exists)
  // Logs 'true' or 'false'
})
```

## Known Issues

There is an issue in `scalable-blob-store` that I have no work around for as of yet. If there are a large number of blobs added and then removed from the store, you may have directories with small numbers of files in them, or empty. These directories will never be removed and will not be populated.

There are two possible solutions for this problem:

- A maintenance task to remove empty directories and migrate low numbered directories into other directories. This is not something that `scalable-blob-store` can do and the developer needs to build this.
- A better solution would be to replace the cached blob path (`this.currentBlobPath`) on the 'blobStore' object with a valid path that is not full.

For my use case, removal of large numbers of files is unlikely to occur, so my motivation to build a solution for this issue is quite low.

## Testing

There are two methods for testing `scalable-blob-store`:

1.  _Unit Testing_ which uses [tape][tape-url] and the local `os.tmpdir()` directory.
2.  _Manual Testing_ which will create directories and files on your local disk.

### Unit Testing

After cloning `scalable-blob-store`, type the following into your console:

```sh
npm install
npm run build
npm test
```

### Manual Testing

Running the `test-fs.js` file will create a `~/blobs` directory in your home directory and then recursively fill it with lots of blobs.

The default options configured in the `test-fs.js` file are:

```js
const opts = {
  blobStoreRoot: os.homedir() + '/blobs',
  idFunction: 'cuid',
  dirDepth: 3,
  dirWidth: 1000
}

const repeat = 10000
```

Change the options if you wish to see different results.

After cloning `scalable-blob-store`, type the following into your console:

```sh
npm install
npm run build
node ./tests/test-fs.js
```

Once complete, inspect the `~/blobs` directory. I suggest using the [tree][tree-url] command which gives you a summary of directories and files within the target directory.

```sh
tree ~/blobs
tree -d ~/blobs
```

## About the Owner

I, Grant Carthew, am a technologist, trainer, and Dad from Queensland, Australia. I work on code in a number of personal projects and when the need arises I build my own packages.

This project exists because I needed a local blob store that could scale.

Everything I do in open source is done in my own time and as a contribution to the open source community.

If you are using my projects and would like to thank me or support me, please click the Patreon link below.

[![Patreon Donation][patreon-image]][patreon-url]

See my [other projects on NPM](https://www.npmjs.com/~grantcarthew).

## Contributing

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin my-new-feature`
5.  Submit a pull request :D

## History

- v4.0.0  [2018-10-29]: Major upgrade to modern syntax. See readme above.
- v3.0.9  [2018-02-26]: Dependency packages updated.
- v3.0.8  [2017-12-22]: Dependency packages updated.
- v3.0.7  [2017-07-28]: Fixed test. Removed mock-fs (now uses /tmp). Dependency packages updated.
- v3.0.6  [2017-05-17]: Dependency packages updated.
- v3.0.5  [2017-03-20]: Dependency packages updated to support Node.js v7.7.3 and mock-fs v4.2.0.
- v3.0.4  [2016-12-05]: Dependency packages updated.
- v3.0.3  [2016-10-10]: Replaced `node-uuid` with `uuid`.
- v3.0.2  [2016-09-20]: Dependency packages updated.
- v3.0.1  [2016-05-05]: Packages updated and minor refactor.
- v3.0.0  [2016-03-07]: Callback support added. createReadStream API changed.
- v2.1.2  [2016-03-05]: Missed duplicate function in tests, removed.
- v2.1.1  [2016-03-05]: Refactored duplicate function in tests.
- v2.1.0  [2016-03-05]: Switched to using the `ES5` build code. Removed Nodejs engine requirements.
- v2.0.10 [2016-03-03]: Dependency packages updated.
- v2.0.9  [2016-02-09]: Added promisifyAll to the fsBlobStore instance. More `return null` statements.
- v2.0.8  [2016-02-09]: Added `return null` after resolve/reject calls to prevent Bluebird warnings.
- v2.0.7  [2016-02-09]: Added `es5dist` for older versions of node. Packages updated.
- v2.0.6  [2016-01-28]: Added failure unit tests.
- v2.0.5  [2016-01-26]: Refactor blob-store.js for minor performance improvement.
- v2.0.4  [2016-01-24]: Minor performance improvements and bug fixes.
- v2.0.3  [2016-01-22]: Added unit tests and minor fix.
- v2.0.2  [2016-01-19]: Added [standard][js-standard-url] to package.json.
- v2.0.1  [2016-01-12]: Minor performance improvements and bug fixes.
- v2.0.0  [2016-01-08]: Added support for [CUID][cuid-url] or [UUID][uuid-url] directory and file names.
- v1.0.1  [2016-01-07]: Last release of v1. Work on v2.0.0 to support cuid.
- v1.0.0  [2016-01-05]: Minor delint and README updates. Bump to v1.0 for future changes.
- v0.4.1  [2015-08-20]: Fix reference error.
- v0.4.0  [2015-08-16]: Changed read and write to createReadStream and createWriteStream.
- v0.3.1  [2015-08-16]: Fix write stream event order.
- v0.3.0  [2015-08-16]: Removed file path function, change of plans.
- v0.2.0  [2015-08-16]: Added file path function.
- v0.1.0  [2015-09-30]: Initial release.

## Credits

Thanks to the following marvelous people for their hard work:

- [Petka Antonov][petka-url] for [bluebird][bluebird-url]
- [Roman Shtylman][defunctzombie-url] for [uuid][uuid-url]
- [Eric Elliot][ericelliott-url] for [cuid][cuid-url]
- [James Halliday][substack-url] for [mkdirp][mkdirp-url]
- [Mathias Buus][mathiasbuus-url] for [fs-blob-store][fsblobstore-url]

This list could go on...

## License

MIT

[sbs-url]: https://github.com/grantcarthew/node-scalable-blob-store
[mrblobby-image]: https://cdn.rawgit.com/grantcarthew/node-scalable-blob-store/master/mrblobby.svg
[bluebird-url]: https://github.com/petkaantonov/bluebird
[bluebird-speed-url]: http://programmers.stackexchange.com/questions/278778/why-are-native-es6-promises-slower-and-more-memory-intensive-than-bluebird
[petka-url]: https://github.com/petkaantonov
[amazones3-url]: https://aws.amazon.com/s3/
[googlecloud-url]: https://cloud.google.com/storage/
[azurestorage-url]: https://azure.microsoft.com/en-us/services/storage/
[filestorage-url]: https://github.com/petersirka/node-filestorage
[glusterfs-url]: http://www.gluster.org/
[uuid-url]: https://www.npmjs.com/package/uuid
[defunctzombie-url]: https://github.com/defunctzombie
[wikiuuid-url]: https://en.wikipedia.org/wiki/Universally_unique_identifier
[cuid-url]: https://github.com/ericelliott/cuid
[objectid-url]: https://docs.mongodb.com/manual/reference/method/ObjectId/
[ulid-url]: https://github.com/ulid/javascript
[awesome-url]: https://github.com/grantcarthew/awesome-unique-id
[mkdirp-url]: https://www.npmjs.com/package/mkdirp
[substack-url]: https://github.com/substack
[ericelliott-url]: https://github.com/ericelliott
[nodefs-url]: https://nodejs.org/api/fs.html#fs_class_fs_stats
[wikistat-url]: https://en.wikipedia.org/wiki/Stat_(system_call)
[readstream-url]: https://nodejs.org/api/stream.html#stream_class_stream_readable
[writestream-url]: https://nodejs.org/api/stream.html#stream_class_stream_writable
[mathiasbuus-url]: https://github.com/mafintosh
[fsblobstore-url]: https://github.com/mafintosh/fs-blob-store
[cc-maintain-badge]: https://api.codeclimate.com/v1/badges/829bd04f05552f59b398/maintainability
[cc-maintain-url]: https://codeclimate.com/github/grantcarthew/node-scalable-blob-store/maintainability
[cc-coverage-badge]: https://api.codeclimate.com/v1/badges/829bd04f05552f59b398/test_coverage
[cc-coverage-url]: https://codeclimate.com/github/grantcarthew/node-scalable-blob-store/test_coverage
[js-standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[js-standard-url]: http://standardjs.com/
[nsp-image]: https://nodesecurity.io/orgs/openjs/projects/3871d340-0ca9-471c-be9a-39df3871262d/badge
[nsp-url]: https://nodesecurity.io/orgs/openjs/projects/3871d340-0ca9-471c-be9a-39df3871262d
[patreon-image]: https://img.shields.io/badge/patreon-donate-yellow.svg
[patreon-url]: https://www.patreon.com/grantcarthew
[nodei-npm-image]: https://nodei.co/npm/scalable-blob-store.png?downloads=true&downloadRank=true&stars=true
[nodei-npm-url]: https://nodei.co/npm/scalable-blob-store/
[travisci-image]: https://travis-ci.org/grantcarthew/node-scalable-blob-store.svg?branch=master
[travisci-url]: https://travis-ci.org/grantcarthew/node-scalable-blob-store
[cuid-discuss-url]: https://github.com/ericelliott/cuid/issues/22
[tape-url]: https://www.npmjs.com/package/tape
[tree-url]: https://www.debian-administration.org/article/606/Commands_you_might_have_missed_tree
[risingstack-url]: https://risingstack.com/
[risingstack-article-url]: https://blog.risingstack.com/how-to-become-a-better-node-js-developer-in-2016
