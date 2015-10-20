# Introduction
`scalable-blob-store` is a simple local file system blob store that is designed to prevent conflicts when used with a distributed or replicated file system.

__WARNING: API change from v0.3 to v0.4!__

I have changed `read` and `write` to `createReadStream` and `createWriteStream`.
This change moves some of the complexity to the consuming code but makes `scalable-blob-store` more of a lower level module.
Now that you have access to the stream you can read and manipulate the stream on writing.
Creating blobs using `string` and `Buffer` objects has also been removed.

# Topics
- [Quick Start](#quick-start)
- [Rationale](#rationale)
- [Function](#function)
- [Performance](#performance)
- [Requirements](#requirements)
- [Installation](#installation)
- [API](#api)
    - [create](#create)
    - [createWriteStream](#createWriteStream)
    - [createReadStream](#createReadStream)
    - [remove](#remove)
    - [stat](#stat)
    - [exists](#exists)
- [Contributing](#contributing)
- [History](#history)
- [Credits](#credits)
- [License](#license)

# Quick Start

Everything in `scalable-blob-store` is asynchronous and is based on Promises using the [Bluebird](https://github.com/petkaantonov/bluebird) library. There are no callbacks in the API. I did this for two reasons; I like Promises, and to support the future ES2016 async / await features.

Basic usage example:

```js
var sbsFactory = require('scalable-blob-store')

var options = {
  blobStoreRoot: '/your/local/root/path',
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
  //   blobPath: "/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19",
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
blobStore.createReadStream('/uuid/path/from/your/database').then((readStream) => {
  // Pipe the file to the console.
  readStream.pipe(process.stdout)
}).catch((err) => {
  console.error(err)
})

// Delete Example
blobStore.remove('/uuid/path/from/your/database').then(() => {
  console.log('Blob removed successfully.')
}).catch((err) => {
  console.error(err)
})

// File Metadata Example
blobStore.stat('/uuid/path/from/your/database').then((stats) => {
  // Returns a unix stats object
  // https://en.wikipedia.org/wiki/Stat_(system_call)
  console.dir(stats)
}).catch((err) => {
  console.error(err)
})

// File Exists Example
blobStore.exists('/uuid/path/from/your/database').then((result) => {
  console.log(result)
  // Logs 'true' or 'false'
}).catch((err) => {
  console.error(err)
})
```

# Rationale
After researching user file storage, or blob storage, for a web application I was working on I discovered the most common solution used by web developers is to create an account with a cloud service provider. After creating an account with such providers as [Amazon S3](https://aws.amazon.com/s3/), [Google Cloud Storage](https://cloud.google.com/storage/), or [Azure Storage](https://azure.microsoft.com/en-us/services/storage/), they just stash all their users files there.

I researched the price of cloud storage and decided I wanted a free local version that would scale if needed.

I looked at a number of existing solutions such as [filestorage](https://github.com/petersirka/node-filestorage) but was unhappy with the scalability of these solutions. Most are only designed for a single server and would cause write conflicts if a distributed file system or cluster file system like [GlusterFS](http://www.gluster.org/) was used as the backend file system.

On a long car trip I was thinking about a solution for my blob storage and came up with `scalable-blob-store`.

# Function
`scalable-blob-store` does not use index files or other databases to manage the files on the disk or storage system. Instead, the file system itself is used to find the current storage path and maintain a reasonable number of files in its directories. Each time you write a new blob, the current save directory files are counted to ensure it remains under the configured value. Because of this there is a performance hit when saving blobs. Check the [Performance](#performance) topic below for some detail.

Because there are no databases used to manage the files in the root path, it is up to you to maintain the returned `blobStore` path and metadata about the stored files in your own database.

The reason `scalable-blob-store` is scalable is due to the naming of the directories and files. Every directory and file saved to disk is named by a [generated](https://github.com/broofa/node-uuid) [v4 UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier). If a replicated or cluster file system is in use the only conflict that can occur is when one server is reading a file while another is removing the same file. `scalable-blob-store` does not try to manage this conflict, however it will raise the exception.

Here is an example of the directory structure created by `scalable-blob-store`:
```
\blobs\846a291f-9864-40bb-aefe-f29bdc73a761 // ← Directory    File ↓   
\blobs\846a291f-9864-40bb-aefe-f29bdc73a761\..\8b86b6fe-6166-424c-aed9-8faf1e62689e
```

`scalable-blob-store` supports configuration options to give you control over the depth of the directory structure and the width of the directories. The default options give 3 directories deep containing 1000 items giving a total storage of 1 billion files within the directory structure.

Other points of interest:
- Files are only stored at the bottom of the directory tree.
- Once the number of files in a directory reaches the `dirWidth` value, the next directory is created.
- Once the number of directories in any directory reaches the `dirWidth` value, the next parent directory is created.
- If the number of directories in the highest directory, being the blob store root, has reached the `dirWidth` value, the `dirWidth` value is ignored.

# Performance
This is an unscientific measurement, however just to get some idea of the write performance I ran a test with the following configuration:
- Virtual Machine running on an SSD disk
- File Content: "The quick brown fox jumped over the lazy dog"
- dirDepth: 3
- dirWidth: 1000
- Repeat: 10,000

With this configuration the following performance was observed:
- Total Time: 118610 milliseconds (119 seconds)
- Total Size: 9.76 GB

Not surprisingly, this configuration created one top tier directory, one second tier directory, and ten third tier directories.

Read performance will be close to disk speed.

# Requirements
- Node.js v4.1.2 or greater.
  Mainly due to the ES6 (ES2015) syntax used. There is no reason a transpiled version would not work against an earlier version of node.


# Installation

```sh
$ npm install scalable-blob-store --save
```

# API
All `API` calls apart from `create(options)` are asynchronous returning Promises resolving to the values below.

<a name="create" />
### `create(options)`
__Returns__: A new `BlobStore` object to be used as a factory.
The `create(options)` function can be called multiple times to create more than one blob store.

Options are past to the constructor function as a `string` or `JSON object`. Only use a `string` if you are happy with the defaults below.

Key | Description | Defaults
--- | ----------- | --------
`blobStoreRoot` | Root directory to store blobs | Required option no defaults
`dirDepth` | How deep you want the directries under the root | 3
`dirWidth` | The maximum number of files or directories in a directory | 1000

Start by creating the `scalable-blob-store` factory object:
```js
var sbsFactory = require('scalable-blob-store')
```

Creating multiple blob stores using strings:
```js
var userFileStore = sbsFacorty.create('/appstore/userfiles')
var pdfDocumentStore = sbsFactory.create('/appstore/documents')
```

Creating a blob store using a `JSON Object`:
```js
var options = {
  blobStoreRoot: '/app/blobs',
  dirDepth: 4,
  dirWidth: 2000
}

var blobStore = sbsFactory.create(options)
```

<a name="createWriteStream" />
### `createWriteStream()`
__Returns__: `JSON Object` containing the child path to the file within the blob store root and a writable file stream.

Returned Object:
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
  //   blobPath: "/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19",
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
__Returns__: [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_readable)

Example:
```js
// Get the blobPath value from your database.
var blobPath = '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19'

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
var blobPath = '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19'

blobStore.remove(blobPath).then(() => {
  console.log('Blob removed successfully.')
}).catch((err) => {
  console.error(err)
})
```

<a name="stat" />
### `stat(string)`
__Returns__: `JSON Object`

Rather than parse the file system [`stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats) object, `scalable-blob-store` returns the raw `stats` object.
More stat class details can be found on [Wikipedia](https://en.wikipedia.org/wiki/Stat_(system_call))

Example:
```js
// Get the blobPath value from your database.
var blobPath = '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19'

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
var blobPath = '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19'

blobStore.exists(blobPath).then((result) => {
  console.log(result)
  // Logs 'true' or 'false'.
}).catch((err) => {
  console.error(err)
})
```

# Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

# History

- v0.4.1: Fix reference error.
- v0.4.0: Changed read and write to createReadStream and createWriteStream.
- v0.3.1: Fix write stream event order.
- v0.3.0: Removed file path function, change of plans.
- v0.2.0: Added file path function.
- v0.1.0: Initial release.

# Credits

Thanks to [Mathias Buus](https://github.com/mafintosh) for his work on [fs-blob-store](https://github.com/mafintosh/fs-blob-store).

# License

MIT
