# Introduction

`scalable-blob-store` is a simple local file system blob store that is designed to prevent conflicts when used with a distributed or replicated file system.

[![bitHound Overall Score][bithound-overall-image]][bithound-overall-url]
[![bitHound Dependencies][bithound-dep-image]][bithound-dep-url]
[![bitHound Code][bithound-code-image]][bithound-code-url]
[![js-standard-style][js-standard-image]][js-standard-url]

[![NPM][nodei-npm-image]][nodei-npm-url]

## Breaking Changes

Version 2 of `scalable-blob-store` has introduced a new directory and file naming option based on [cuid][cuid-url]. There is now a required option to specify the type of id system to use being either CUID or UUID. Also, using a `string` for the options in the create method is no longer supported. Apart from that, the API has not changed.

To migrate to v2 simply add the `idType: 'uuid'` to the options passed into the create method. Alternatively switch to `cuid` with the option `idType: 'cuid'`.

## Topics

-   [Quick Start](#quick-start)

-   [Rationale](#rationale)

-   [Function](#function)

-   [Performance](#performance)

-   [Requirements](#requirements)

-   [Installation](#installation)

-   [API](#api)

    -   [create](#create)
    -   [createWriteStream](#createWriteStream)
    -   [createReadStream](#createReadStream)
    -   [remove](#remove)
    -   [stat](#stat)
    -   [exists](#exists)

-   [Known Issues](#known-issues)

-   [Contributing](#contributing)

-   [History](#history)

-   [Credits](#credits)

-   [License](#license)

## Quick Start

Everything in `scalable-blob-store` is asynchronous and is based on Promises using the [Bluebird][bluebird-url] library. There are no callbacks in the API. I did this for two reasons; I like Promises, and to support the future ES2016 async / await features.

Basic usage example:

```js
var sbsFactory = require('scalable-blob-store')

var options = {
  blobStoreRoot: '/your/local/root/path',
  idType: 'cuid',
  dirDepth: 4,
  dirWidth: 1000
}

// Creating the blobStore Object
var blobStore = sbsFactory.create(options)

var fs = require('fs')
var readStream = fs.createReadStream('/path/to/file')

// Writing Exapmle
blobStore.createWriteStream().then((result) => {
  console.dir(result)
  // Logs the result object which contains the blobPath and writeStream.
  // Use the writeStream to save your blob.
  // Store the blobPath in your database.
  //
  // result object will be similar to this:
  // {
  //   blobPath: "/cij50xids00ulzph3n49znlex/cij50xidu00upzph327c9zwwh/cij50xidx00utzph3ikjxzkt7/cij50xidq00ujzph3o3nsthq7",
  //   writeStream: [object Object]
  // }
  return new Promise((resolve, reject) => {
    result.writeStream.on('finish', () => {
        resolve(result.blobPath)
    })
    result.writeStream.on('error', reject)
    readStream.pipe(result.writeStream)
  })
}).then((blobPath) => {
  console.log(blobPath)
  // Logs the blobPath. Save this in your database.
}).catch((err) => {
  // Consider removing the empty blob from the file system. Code no included.
  console.error(err)
})

// Reading Example
blobStore.createReadStream('/id/path/from/your/database').then((readStream) => {
  // Pipe the file to the console.
  readStream.pipe(process.stdout)
}).catch((err) => {
  console.error(err)
})

// Delete Example
blobStore.remove('/id/path/from/your/database').then(() => {
  console.log('Blob removed successfully.')
}).catch((err) => {
  console.error(err)
})

// File Metadata Example
blobStore.stat('/id/path/from/your/database').then((stats) => {
  // Returns a unix stats object
  // https://en.wikipedia.org/wiki/Stat_(system_call)
  console.dir(stats)
}).catch((err) => {
  console.error(err)
})

// File Exists Example
blobStore.exists('/id/path/from/your/database').then((result) => {
  console.log(result)
  // Logs 'true' or 'false'
}).catch((err) => {
  console.error(err)
})
```

## Rationale

After researching user file storage, or blob storage, for a web application I was working on I discovered the most common solution used by web developers is to create an account with a cloud service provider. After creating an account with such providers as [Amazon S3][amazones3-url], [Google Cloud Storage][googlecloud-url], or [Azure Storage][azurestorage-url], they just stash all their users files there.

I researched the price of cloud storage and decided I wanted a free local version that would scale if needed.

I looked at a number of existing solutions such as [filestorage][filestorage-url] but was unhappy with the scalability of these solutions. Most are only designed for a single server and would cause write conflicts if a distributed file system or cluster file system like [GlusterFS][glusterfs-url] was used as the backend file system.

On a long car trip I was thinking about a solution for my blob storage and came up with `scalable-blob-store`.

## Function

`scalable-blob-store` does not use index files or other databases to manage the files on the disk or storage system. Instead, the file system itself is used to find the current storage path and maintain a reasonable number of files in its directories. Each time you write a new blob, the current save directory files are counted to ensure it remains under the configured value. Because of this there is a performance hit when saving blobs. Check the [Performance](#performance) topic below for some detail.

Because there are no databases used to manage the files in the root path, it is up to you to maintain the returned `blobStore` path and metadata about the stored files in your own database.

The reason `scalable-blob-store` is scalable is due to the naming of the directories and files. Every directory and file saved to disk is named by a generated id based on either [CUID][cuid-url] or [v4 UUID][nodeuuid-url]. (here is a [discussion about CUIDs and UUIDs][cuid-discuss-url]). If a replicated or cluster file system is in use the only conflict that can occur is when one server is reading a file while another is removing the same file. `scalable-blob-store` does not try to manage this conflict, however it will raise the exception.

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

`scalable-blob-store` supports configuration options to give you control over the type of ids used, depth of the directory structure, and the width of the directories. The default options give 3 directories deep containing 1000 items giving a total storage of 1 billion files within the directory structure.

Other points of interest:

-   Files are only stored at the bottom of the directory tree.
-   The directory used for writing files is determined by the latest creation time (file system birthtime attribute).
-   Once the number of files in a directory reaches the `dirWidth` value, the next directory is created.
-   Once the number of directories in any directory reaches the `dirWidth` value, the next parent directory is created.
-   If the number of directories in the highest directory, being the blob store root, has reached the `dirWidth` value, the `dirWidth` value is ignored.

## Performance

### Write

This is an unscientific measurement, however just to get some idea of the write performance I ran a test with the following configuration:

-   Virtual Machine with Debian GNU/Linux running on an SSD disk
-   File Content: "The quick brown fox jumped over the lazy dog"
-   dirDepth: 3
-   dirWidth: 1000
-   Repeat: 10,000

With this configuration the following performance was observed:

-   Files Created: 10,000
-   Total File Size: 40MB
-   Total Size on Disk: 9.76GB (ext4 file system)
-   Total Time CUID: 115123 milliseconds (115 seconds)
-   Total Time UUID: 115743 milliseconds (116 seconds)

Not surprisingly, this configuration created one top tier directory, one second tier directory, and ten third tier directories.

It is also worth noting there's not a lot of content in each file however a large number of files. It is the creation of the files in the file system that is taking a majority of the time.

### Read

Read performance will be close to, if not the same, as disk speed.

## Requirements

-   Node.js v4.1.2 or greater.
  Mainly due to the ES6 (ES2015) syntax used. There is no reason a transpiled version would not work against an earlier version of node.

## Installation

```sh
npm install scalable-blob-store --save
```

## API

All `API` calls apart from `create(options)` are asynchronous returning Promises resolving to the values below.

<a name="create" />

### `create(options)`

__Returns__: A new `BlobStore` object to be to store data.
The `create(options)` function can be called multiple times to create more than one blob store.

Options are passed to the constructor function as a JavaScript `object`.

|Key            |Description                                              |Defaults                   |
|---------------|---------------------------------------------------------|---------------------------|
|`blobStoreRoot`|Root directory to store blobs                            |Required                   |
|`idType`       |Either 'cuid' or 'uuid' as directory and file names      |Required                   |
|`dirDepth`     |How deep you want the directories under the root         |3                          |
|`dirWidth`     |The maximum number of files or directories in a directory|1000                       |

Start by creating the `scalable-blob-store` factory object:

```js
var sbsFactory = require('scalable-blob-store')
```

Create a blob store using a JavaScript `object`:

```js
var options = {
  blobStoreRoot: '/app/blobs',
  idType: 'cuid',
  dirDepth: 4,
  dirWidth: 2000
}

var blobStore = sbsFactory.create(options)
```

Creating multiple blob stores:

```js
var userOptions = {
  blobStoreRoot: '/app/blobs/user',
  idType: 'cuid',
  dirDepth: 4,
  dirWidth: 2000
}

var pdfOptions = {
  blobStoreRoot: '/app/blobs/pdf',
  idType: 'uuid',
  dirDepth: 2,
  dirWidth: 300
}

var userFileStore = sbsFacorty.create(userOptions)
var pdfDocumentStore = sbsFactory.create(pdfOptions)
```

<a name="createWriteStream" />

### `createWriteStream()`

__Returns__: `object` containing the child path to the file within the blob store root and a writable file stream.

Returned Object using CUID as the idType:

```js
{
  blobPath: "/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h",
  writeStream: stream.Writable
}
```

Returned Object using UUID as the idType:

```js
{
  blobPath: "/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19",
  writeStream: stream.Writable
}
```

Use the `writeStream` to save your blob or file.
The `blobPath` needs to be saved to your database for future access.

Example:

```js
var fs = require('fs')
var readStream = fs.createReadStream('/path/to/file')

blobStore.createWriteStream().then((result) => {
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
}).then((blobPath) => {
  console.log(blobPath)
  // Logs the blobPath. Save this in your database.
}).catch((err) => {
  console.error(err)
})
```

<a name="createReadStream" />

### `createReadStream(string)`

__Returns__: [`stream.Readable`][readstream-url]

Example:

```js
// Get the blobPath value from your database.
var blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.createReadStream(blobPath).then((readStream) => {
  // Blob contents is piped to the console.
  readStream.pipe(process.stdout)
}).catch((err) => {
  console.error(err)
})
```

<a name="remove" />

### `remove(string)`

__Returns__: `undefined` if nothing went wrong or `error`

Example:

```js
// Get the blobPath value from your database.
var blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.remove(blobPath).then(() => {
  console.log('Blob removed successfully.')
}).catch((err) => {
  console.error(err)
})
```

<a name="stat" />

### `stat(string)`

__Returns__: `object`

Rather than parse the file system [`stats`][nodefs-url] object, `scalable-blob-store` returns the raw `stats` object.
More stat class details can be found on [Wikipedia][wikistat-url]

Example:

```js
// Get the blobPath value from your database.
var blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.stat(blobPath).then((stats) => {
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
}).catch((err) => {
  console.error(err)
})
```

<a name="exists" />

### `exists(string)`

__Returns__: `boolean`

`true` if the file exists, otherwise `false`.

Example:

```js
// Get the blobPath value from your database.
var blobPath = '/cij50xi3y00iyzph3qs7oatcy/cij50xi3z00izzph3yo053mzs/cij50xi4000j0zph3mshil7p5/cij50xi4100j1zph3loy3hp6h'

blobStore.exists(blobPath).then((result) => {
  console.log(result)
  // Logs 'true' or 'false'.
}).catch((err) => {
  console.error(err)
})
```

## Known Issues

There is an issue in `scalable-blob-store` that I have no work around for as of yet. If there are a large number of blobs added and then removed from the store, you may have directories with small numbers of files in them, or empty. These directories will never be removed and will not be populated.

There are two possible solutions for this problem:

-   A maintenance task to remove empty directories and migrate low numbered directories into other directories. This is not something that `scalable-blob-store` can do and the developer needs to build this.
-   A better solution would be to replace the cached blob path (`this.currentBlobPath`) on the 'blobStore' object with a valid path that is not full.

For my use case, removal of large numbers of files is unlikely to occur, so my motivation to build a solution for this issue is quite low.

## Contributing

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin my-new-feature`
5.  Submit a pull request :D

## History

-   v2.0.0: Added support for [CUID][cuid-url] or [UUID][nodeuuid-url] directory and file names.
-   v1.0.1: Last release of v1. Work on v2.0.0 to support cuid.
-   v1.0.0: Minor delint and README updates. Bump to v1.0 for future changes.
-   v0.4.1: Fix reference error.
-   v0.4.0: Changed read and write to createReadStream and createWriteStream.
-   v0.3.1: Fix write stream event order.
-   v0.3.0: Removed file path function, change of plans.
-   v0.2.0: Added file path function.
-   v0.1.0: Initial release.

## Credits

Thanks to [Mathias Buus][mathiasbuus-url] for his work on [fs-blob-store][fsblobstore-url].

## License

MIT

[bluebird-url]: https://github.com/petkaantonov/bluebird
[amazones3-url]: https://aws.amazon.com/s3/
[googlecloud-url]: https://cloud.google.com/storage/
[azurestorage-url]: https://azure.microsoft.com/en-us/services/storage/
[filestorage-url]: https://github.com/petersirka/node-filestorage
[glusterfs-url]: http://www.gluster.org/
[nodeuuid-url]: https://github.com/broofa/node-uuid
[wikiuuid-url]: https://en.wikipedia.org/wiki/Universally_unique_identifier
[nodefs-url]: https://nodejs.org/api/fs.html#fs_class_fs_stats
[wikistat-url]: https://en.wikipedia.org/wiki/Stat_(system_call)
[readstream-url]: https://nodejs.org/api/stream.html#stream_class_stream_readable
[mathiasbuus-url]: https://github.com/mafintosh
[cuid-url]: https://github.com/ericelliott/cuid
[fsblobstore-url]: https://github.com/mafintosh/fs-blob-store
[bithound-overall-image]: https://www.bithound.io/github/grantcarthew/node-scalable-blob-store/badges/score.svg
[bithound-overall-url]: https://www.bithound.io/github/grantcarthew/node-scalable-blob-store
[bithound-dep-image]: https://www.bithound.io/github/grantcarthew/node-scalable-blob-store/badges/dependencies.svg
[bithound-dep-url]: https://www.bithound.io/github/grantcarthew/node-scalable-blob-store/master/dependencies/npm
[bithound-code-image]: https://www.bithound.io/github/grantcarthew/node-scalable-blob-store/badges/code.svg
[bithound-code-url]: https://www.bithound.io/github/grantcarthew/node-scalable-blob-store
[js-standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[js-standard-url]: http://standardjs.com/
[nodei-npm-image]: https://nodei.co/npm/scalable-blob-store.png?downloads=true&downloadRank=true&stars=true
[nodei-npm-url]: https://nodei.co/npm/scalable-blob-store/
[cuid-discuss-url]: https://github.com/ericelliott/cuid/issues/22
