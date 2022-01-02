# Introduction

A file system blob store that is designed to prevent conflicts when used with a distributed file system or storage area network.

[![unit-tests](https://github.com/grantcarthew/node-scalable-blob-store/actions/workflows/unit-tests.yaml/badge.svg)][actions-url]
[![Patreon Donation][patreon-image]][patreon-url]

[![Mr Blobby][mrblobby-image]][sbs-url]

[![NPM][nodei-npm-image]][nodei-npm-url]

Please **Star** on GitHub / NPM and **Watch** for updates.

## Topics

- [Features](#features)
- [Quick Start](#quick-start)
- [Rationale](#rationale)
- [Function](#function)
- [Performance](#performance)
- [API](#api)
- [Known Issues](#known-issues)
- [Testing](#testing)
- [About the Owner](#about-the-owner)
- [Contributing](#contributing)
- [History](#history)
- [License](#license)

## Features

- Save binary large objects (blobs) locally in a scalable format.
- Written using modern JavaScript language features.
- No dependencies.
- Blob file and directory names based on unique IDs.
- Extensive read / write APIs in both stream and file format.
- Promise based with no callbacks.

## Quick Start

### Installation

Note: Requires Node.js v12 or later.

```sh

npm install scalable-blob-store --save

```

### Create a writable stream

```js
const os = require('os');
const ulid = require('ulid').ulid; // You need a unique ID generator function
const BlobStore = require('scalable-blob-store');

const options = {
  blobStoreRoot: os.tmpdir() + '/blobs', // Change this!
  idFunction: ulid,
  dirDepth: 4,
  dirWidth: 1000,
};

// Creating the blobStore Object
const blobStore = new BlobStore(options);
const result = await blobStore.createWriteStream();

console.dir(result);
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

- [quick-start-write.js](/examples/quick-start-write.js)
- [quick-start-read.js](/examples/quick-start-read.js)
- [quick-start-api.js](/examples/quick-start-api.js)

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

**Write**

On my laptop with an M.2 SSD disk, running the [test-fs.js](tests/test-fs.js) script produces the following results:

```
====================================================================================================
Testing scalable-blob-store with the following options:
blobStoreRoot: /tmp/blobs/test-fs
idFunction: ulid
dirDepth: 3
dirWidth: 1000
repeat: 10000

Beginning test...
====================================================================================================
Test complete.
====================================================================================================
{
  blobStoreRoot: '/tmp/blobs/test-fs',
  dirDepth: 3,
  dirWidth: 1000,
  runTimeMilliseconds: 83730,
  totalDirectories: 12,
  totalFiles: 10000,
  totalBytes: 430000,
  lastBlobPath: '/ckxwcwgwz0001lk9hgq8t9iup/ckxwcwgx00002lk9h6tbpdmq1/ckxwcy36m06yclk9hb0g92dwg/ckxwcy9ip07q4lk9h5uyl10k6'
}
====================================================================================================
Please remove /tmp/blobs/test-fs manually.
====================================================================================================
```

**Read**

Read performance will be close to, if not the same, as disk speed.

## API

All the BlobStore methods within `scalable-blob-store` return a Promise. This is perfect for using with the async/await language features.

| API                                                        | Type               | Returns               |
| ---------------------------------------------------------- | ------------------ | --------------------- |
| [new BlobStore(options)](#instantiation)                   | Constructor        | blobStore Instance    |
| [blobStore.blobStoreRoot](#blobstoreroot)                  | Read Only Property | `String`              |
| [blobStore.idFunction](#idfunction)                        | Read Only Property | `Function`            |
| [blobStore.dirDepth](#dirdepth)                            | Read Only Property | `Number`              |
| [blobStore.dirWidth](#dirwidth)                            | Read Only Property | `Number`              |
| [blobStore.getCurrentBlobDir()](#getcurrentblobdir)        | Method             | `Promise<String>`     |
| [blobStore.setCurrentBlobDir(blobDir)](#setcurrentblobdir) | Method             | `Promise<undefined>`  |
| [blobStore.createWriteStream()](#createwritestream)        | Method             | `Promise<Object>`     |
| [blobStore.write(data, writeOptions)](#write)              | Method             | `Promise<String>`     |
| [blobStore.append(blobPath, data, appendOptions)](#append) | Method             | `Promise<undefined>`  |
| [blobStore.copy(blobPath, flags)](#copy)                   | Method             | `Promise<String>`     |
| [blobStore.createReadStream(blobPath)](#createreadstream)  | Method             | `Promise<ReadStream>` |
| [blobStore.read(blobPath, readOptions)](#read)             | Method             | `Promise<data>`       |
| [blobStore.open(blobPath, flags, mode)](#open)             | Method             | `Promise<FileHandle>` |
| [blobStore.realPath(blobPath, realPathOptions)](#realpath) | Method             | `Promise<String>`     |
| [blobStore.stat(blobPath)](#stat)                          | Method             | `Promise<Stats>`      |
| [blobStore.exists(blobPath)](#exists)                      | Method             | `Promise<Boolean>`    |
| [blobStore.remove(blobPath)](#remove)                      | Method             | `Promise<undefined>`  |

<a name="instantiation"></a>

### `new BlobStore(options)`

**Type:** Constructor function.

**Parameter:** `options` as an `Object`.

- A JavaScript object with desired options set. See below.

**Returns**: A new `BlobStore` object to be used to store data.

**Description:**

You can call `new BlobStore(options)` multiple times to create more than one blob store.

Options are passed to the constructor function as a JavaScript `object`.

| Key             | Description                                               | Defaults |
| --------------- | --------------------------------------------------------- | -------- |
| `blobStoreRoot` | Root directory to store blobs                             | Required |
| `idFunction`    | Any ID function that returns a unique ID string           | Required |
| `dirDepth`      | How deep you want the directories under the root          | 3        |
| `dirWidth`      | The maximum number of files or directories in a directory | 1000     |

**Example:**

```js
// Start by requiring the `scalable-blob-store` constructor function:
const BlobStore = require('scalable-blob-store');

// You will need a unique ID function
const uuid = require('uuid');

// Create the options object
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 4,
  dirWidth: 2000,
};

// Create a blob store using the options `object`:
const blobStore = new BlobStore(options);
```

Creating multiple blob stores:

```js
const userOptions = {
  blobStoreRoot: '/app/blobs/user',
  idFunction: uuid.v4,
  dirDepth: 4,
  dirWidth: 2000,
};

const pdfOptions = {
  blobStoreRoot: '/app/blobs/pdf',
  idFunction: uuid.v4,
  dirDepth: 2,
  dirWidth: 300,
};

const userFileStore = new BlobStore(userOptions);
const pdfDocumentStore = new BlobStore(pdfOptions);
```

<a name="blobstoreroot"><a/>

### `blobStoreRoot`

**Type:** Read only property.

**Returns:** A `String` that matches your `options.blobStoreRoot` value.

**Description:**

This is a convenience property to allow you to pass the blobStore object to a sub module and still have access to the configured properties.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 4,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);
console.log(blobStore.blobStoreRoot);
// Outputs '/app/blobs' which you configured in the options
```

<a name="idfunction"><a/>

### `idFunction`

**Type:** Read only property.

**Returns:** The unique ID function you configured in the `options.idFunction` value.

**Description:**

This is a convenience property to allow you to pass the blobStore object to a sub module and still have access to the configured properties.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 4,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);
console.log(blobStore.idFunction());
// Outputs 'bac00ab2-5e6d-4b77-bfa4-e9befc3e4279' which is a generated UUID from the idFunction.
```

<a name="dirdepth"><a/>

### `dirDepth`

**Type:** Read only property.

**Returns:** A `Number` that matches your `options.dirDepth` value.

**Description:**

This is a convenience property to allow you to pass the blobStore object to a sub module and still have access to the configured properties.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 4,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);
console.log(blobStore.dirDepth);
// Outputs '4' which you configured in the options
```

<a name="dirwidth"><a/>

### `dirWidth`

**Type:** Read only property.

**Returns:** A `Number` that matches your `options.dirWidth` value.

**Description:**

This is a convenience property to allow you to pass the blobStore object to a sub module and still have access to the configured properties.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 4,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);
console.log(blobStore.dirWidth);
// Outputs '2000' which you configured in the options
```

<a name="getcurrentblobdir"><a/>

### `getCurrentBlobDir()`

**Type:** Method.

**Returns:** A `Promise` that resolves to a `String` that is the current active blob creation directory.

**Description:**

This function is used internally by the `BlobStore` to determine the directory where the next blob file will be saved to disk.

If you ever need to store a blob file outside of the `BlobStore` you could use this method to locate the right place to put your file.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  try {
    console.log(await blobStore.getCurrentBlobDir());
    // The 'dirDepth' option above is set to 3 so the output will be similar to the following:
    // '/e44d3b0d-b552-4257-8b64-a53331184c38/443061b9-bfa7-40fc-a5a9-d848bc52155e/4d818f4c-88b3-45fd-a104-a2fc3700e9de'
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="setcurrentblobdir"><a/>

### `setCurrentBlobDir(blobDir)`

**Type:** Method.

**Parameters:** `blobDir` as a `String`.

- Represents a file system directory path you desire to store blob files in that will be located under the `blobStoreRoot` path.

**Returns:** A `Promise` that resolves to `undefined`.

**Description:**

This function can be used to guide the `BlobStore` to save new blob files into a desired `blobPath`.

One issue with `scalable-blob-store` is that if you remove many blob files the directories the files were located in will not be removed.
You could either remove the directories yourself, or repopulate them with new blob files by setting the current active blob directory.

This function was added to enable consumers of this module to work around empty blob directories.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  try {
    console.log(await blobStore.getCurrentBlobDir());
    // The 'dirDepth' option above is set to 3 so the output will be similar to the following:
    // '/e44d3b0d-b552-4257-8b64-a53331184c38/443061b9-bfa7-40fc-a5a9-d848bc52155e/4d818f4c-88b3-45fd-a104-a2fc3700e9de'

    await blobStore.setCurrentBlobDir('/some/blob/path');

    console.log(await blobStore.getCurrentBlobDir());
    // Outputs '/some/blob/path' to the console.
    // Any new blob files added to the blob store will go into this path until there are `dirWidth` or 2000 files within it.
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="createWriteStream"><a/>

### `createWriteStream()`

**Type:** Method.

**Returns**: A `Promise` that resolves to an `Object` containing the child path to the file within the blob store root and a [WriteStream][writestream-url].

**Description:**

Here is an exampe of the returned object using UUID as the idFunction:

```js

{
  blobPath: "/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19",
  writeStream: stream.Writable
}

```

Use the `writeStream` to save your blob or file.
The `blobPath` needs to be saved to your database for future access.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

// The below readStream is simply to make this a complete example
const fs = require('fs');
const readStream = fs.createReadStream('/path/to/file');

async function main() {
  let result;
  try {
    result = await blobStore.createWriteStream();
  } catch (err) {
    console.error(err);
  }

  console.dir(result);
  // result object will be similar to this:
  // {
  //   blobPath: "/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19",
  //   writeStream: [WriteStream]
  // }

  // Using a Promise to encapsulate the write asynchronous events.
  await new Promise((resolve, reject) => {
    result.writeStream.on('finish', () => {
      resolve();
    });
    result.writeStream.on('error', reject);
    readStream.pipe(result.writeStream);
  });

  console.log(blobPath);
  // Logs the blobPath. Save this in your database.
}
main();
```

<a name="write"><a/>

### `write(data, writeOptions)`

**Type:** Method.

**Parameter:** `data` as either `String`, `Buffer`, `TypedArray`, or `DataView`.

**Parameter:** `writeOptions` as an `Object`.

- The `writeOptions` object supports an encoding, mode, and flag property.
- See the [writeFile](https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback) documentation for more detail.

**Returns:** A `Promise` that resolves to a `String`.

- The string contains the `blobPath` value which needs committing to your database.

**Description:**

If you have simple data in memory rather than a stream of data you can use this method to store the data into a blob file.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  const data = 'The quick brown fox jumps over the lazy dog.';

  try {
    const blobPath = await blobStore.write(data);
    // The returned blobPath will look something like this:
    // '/e44d3b0d-b552-4257-8b64-a53331184c38/443061b9-bfa7-40fc-a5a9-d848bc52155e/4d818f4c-88b3-45fd-a104-a2fc3700e9de'
    // Save it to your database.
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="append"><a/>

### `append(blobPath, data, appendOptions)`

**Type:** Method.

**Parameter:** `blobPath` as a `String`.

- Retrieve the `blobPath` from your application database.

**Parameter:** `data` as either a `String` or `Buffer`.

**Parameter:** `appendOptions` as an `Object`.

- The `appendOptions` object supports an encoding, mode, and flag property.
- See the [appendFile](https://nodejs.org/api/fs.html#fs_fs_appendfile_path_data_options_callback) documentation for more detail.

**Returns:** A `Promise` that resolves to a `undefined`.

**Description:**

Use this method to add simple in memory data to the end of the blob file.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  const data = 'The quick brown fox jumps over the lazy dog.';

  try {
    await blobStore.append(data);
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="copy"><a/>

### `copy(blobPath, flags)`

**Type:** Method.

**Parameter:** `blobPath` as a `String`.

- Retrieve the `blobPath` from your application database.

**Parameter:** `flags` as a `Number`.

- See the [copyFile](https://nodejs.org/api/fs.html#fs_fspromises_copyfile_src_dest_flags) documentation for more detail.

**Returns:** A `Promise` that resolves to a `String`.

- The returned string is a new `blobPath` value for the copied blob file.

**Description:**

Use this method to create a copy of an existing blob file.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  try {
    const blobPathSource =
      '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19';

    const blobPathDest = await blobStore.copy(blobPathSource);
    // Store your new blobPath into your application database
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="createreadstream"><a/>

### `createReadStream(blobPath)`

**Type:** Method.

**Parameter:** `blobPath` as a `String`.

- Retrieve the `blobPath` from your application database.

**Returns**: A `Promise` that resolves to a [`ReadStream`][readstream-url].

**Description:**

Creates a readable stream to the blob file located at the `blobPath`.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};
async function main() {
  // Get the blobPath value from your database.
  const blobPath =
    '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19h';

  let readStream;
  try {
    readStream = await blobStore.createReadStream(blobPath);
  } catch (err) {
    console.error(err);
  }

  readStream.on('error', (err) => {
    console.error(err);
  });

  // Blob contents is piped to the console.
  readStream.pipe(process.stdout);
}
main();
```

<a name="read"><a/>

### `read(blobPath, readOptions)`

**Type:** Method.

**Parameter:** `blobPath` as a `String`.

- Retrieve the `blobPath` from your application database.

**Parameter:** `readOptions` as an `Object`.

- See the [readFile](https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options) documentation for more detail.

**Returns:** A `Promise` that resolves to a the contents of the blob file.

- The format of the file contents will depend on the readOptions passed.
- `scalable-blob-store` sets the `readOptions.encoding` value to 'utf8' by default.

**Description:**

Use this method to read the content of a small blob file into memory.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  try {
    // Retrieve the blobPath value from your database
    const blobPath =
      '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19';

    const content = await blobStore.read(blobPath);
    // Do something with the content
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="open"><a/>

### `open(blobPath, flags, mode)`

**Type:** Method.

**Parameter:** `blobPath` as a `String`.

- Retrieve the `blobPath` from your application database.

**Parameter:** `flags` as an `String` or `Number`.

- See the [open](https://nodejs.org/api/fs.html#fs_fspromises_open_path_flags_mode) documentation for more detail.

**Returns:** A `Promise` that resolves to a [FileHandle](https://nodejs.org/api/fs.html#fs_class_filehandle) object.

**Description:**

This is a more advanced method allowing you to carry out [many file operations](https://nodejs.org/api/fs.html#fs_class_filehandle) against the blob file.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  try {
    // Retrieve the blobPath value from your database
    const blobPath =
      '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19';

    const fileHandle = await blobStore.open(blobPath);
    // Do something with the file handle object
    // See the documentation for more detail
    // The documentation link is in the description above
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="realpath"><a/>

### `realPath(blobPath, realPathOptions)`

**Type:** Method.

**Parameter:** `blobPath` as a `String`.

- Retrieve the `blobPath` from your application database.

**Parameter:** `realPathOptions` as a `String` or `Object`.

- See the [realPath](https://nodejs.org/api/fs.html#fs_fspromises_realpath_path_options) documentation for more detail.

**Returns:** A `Promise` that resolves to a `String`.

- The returned string will be the full file system path of the blob file.

**Description:**

Use this method to locate a blob file on the file system. This method should not really be needed because you can determine the full blob file path. Simply concatenate the blobStoreRoot and the blobPath values.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  try {
    // Retrieve the blobPath value from your database
    const blobPath =
      '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19';

    const fsPath = await blobStore.realPath(blobPath);
    // With the above options the result will be similar to this:
    // '/app/blobs/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="stat"><a/>

### `stat(blobPath)`

**Type:** Method.

**Parameter:** `blobPath` as a `String`.

**Returns:** A stats `Object`.

**Description:**

Rather than parse the file system [`stats`][nodefs-url] object, `scalable-blob-store` returns the raw `stats` object.

More stat class details can be found on [Wikipedia][wikistat-url].

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  try {
    // Retrieve the blobPath value from your database
    const blobPath =
      '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19';

    const stats = await blobStore.stat(blobPath);
    console.dir(stats);
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
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="exists"><a/>

### `exists(blobPath)`

**Type:** Method.

**Parameter:** `blobPath` as a `String`.

**Returns:** `Boolean`

- `true` if the file exists, otherwise `false`.

**Description:**

Use this method for a simple blob file existence test.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  try {
    // Retrieve the blobPath value from your database
    const blobPath =
      '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19';

    const exists = await blobStore.exists(blobPath);
    // The result will be either true or false depending if the blob file exists.
  } catch (err) {
    console.error(err);
  }
}
main();
```

<a name="remove"><a/>

### `remove(blobPath)`

**Type:** Method.

**Parameter:** `blobPath` as a `String`.

**Returns**: `undefined` if nothing went wrong or the file did not exist.

**Description:**

Use this method to delete a blob file. This method can not be used to remove directories.

**Example:**

```js
const BlobStore = require('scalable-blob-store');
const uuid = require('uuid');
const options = {
  blobStoreRoot: '/app/blobs',
  idFunction: uuid.v4,
  dirDepth: 3,
  dirWidth: 2000,
};

const blobStore = new BlobStore(options);

async function main() {
  try {
    // Retrieve the blobPath value from your database
    const blobPath =
      '/e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02/fea722d1-001a-4765-8408-eb8e0fe7dbc6/183a6b7b-2fd6-4f80-8c6a-2647beb7bb19';

    await blobStore.remove(blobPath);
    // The blob file will no longer exist
  } catch (err) {
    console.error(err);
  }
}
main();
```

## Known Issues

There is a minor issue in `scalable-blob-store`. If there are a large number of blob files added and then removed from the blob store, you may have empty directories or directories with a small number of files in them. These directories will never be removed and will not be populated.

If you wish to prevent empty or sparsely populated directories you will need to run a maintenance task against the `blobStoreRoot` directory. This maintenance task will need to look for empty or incomplete directories and call the [setCurrentBlobDir](#setcurrentblobdir) method passing in the empty `blobPath`.

For your application you may find you rarely remove large numbers of blob files. If this is the case then this issue can be ignored.

## Testing

There are two methods for testing `scalable-blob-store`:

1.  _Unit Testing_ which uses [tap][tap-url] and the local `os.tmpdir()` directory.
2.  _Manual Testing_ which will create directories and files on your local disk.

### Unit Testing

After cloning `scalable-blob-store`, type the following into your console:

```sh

npm install
npm test

```

### Manual Testing

Running the [test-fs.js](tests/test-fs.js) file will create a `~/blobs` directory in your temporary directory and then recursively fill it with lots of blobs.

The default options configured in the `test-fs.js` file are:

```js
const opts = {
  blobStoreRoot: os.tmpdir() + '/blobs',
  idFunction: cuid,
  dirDepth: 3,
  dirWidth: 1000,
};

const repeat = 10000;
```

Change the options if you wish to see different results.

After cloning `scalable-blob-store`, type the following into your console:

```sh

npm install
node ./tests/test-fs.js

```

Once complete, inspect the `/tmp/blobs` directory. I suggest using the **tree** command which gives you a summary of directories and files within the target directory.

```sh

tree ~/blobs
tree -d ~/blobs

```

## About the Owner

I, Grant Carthew, am a technologist from Queensland, Australia. I work on code in a number of personal projects and when the need arises I build my own packages.

This project exists because I needed a local blob store that could scale.

Everything I do in open source is done in my own time and as a contribution to the open source community.

If you are using my projects and would like to thank me or support me, please click the Patreon link below.

[![Patreon Donation][patreon-image]][patreon-url]

See my [other projects on NPM](https://www.npmjs.com/~grantcarthew).

## Contributing

1. Fork it!
1. Create your feature branch: `git checkout -b my-new-feature`
1. Commit your changes: `git commit -am 'Add some feature'`
1. Push to the branch: `git push origin my-new-feature`
1. Submit a pull request :D

## History

- v5.0.1 [2022-01-02]: Updated README. New version to publish to npmjs.
- v5.0.0 [2022-01-02]: Upgrade Node.js version and minor fixes:
  - Node.js minimum version updated to v12 or later.
  - Dependency packages updated.
  - Replaced Jest with Tap for unit testing.
  - Updated fs-blob-dir-latest sort function to include duplicate creation time handling.
  - Converted all files from CRLF to LF line endings.
- v4.0.0 [2018-10-29]: Major upgrade to modern syntax. See readme above.
- v3.0.9 [2018-02-26]: Dependency packages updated.
- v3.0.8 [2017-12-22]: Dependency packages updated.
- v3.0.7 [2017-07-28]: Fixed test. Removed mock-fs (now uses /tmp). Dependency packages updated.
- v3.0.6 [2017-05-17]: Dependency packages updated.
- v3.0.5 [2017-03-20]: Dependency packages updated to support Node.js v7.7.3 and mock-fs v4.2.0.
- v3.0.4 [2016-12-05]: Dependency packages updated.
- v3.0.3 [2016-10-10]: Replaced `node-uuid` with `uuid`.
- v3.0.2 [2016-09-20]: Dependency packages updated.
- v3.0.1 [2016-05-05]: Packages updated and minor refactor.
- v3.0.0 [2016-03-07]: Callback support added. createReadStream API changed.
- v2.1.2 [2016-03-05]: Missed duplicate function in tests, removed.
- v2.1.1 [2016-03-05]: Refactored duplicate function in tests.
- v2.1.0 [2016-03-05]: Switched to using the `ES5` build code. Removed Nodejs engine requirements.
- v2.0.10 [2016-03-03]: Dependency packages updated.
- v2.0.9 [2016-02-09]: Added promisifyAll to the fsBlobStore instance. More `return null` statements.
- v2.0.8 [2016-02-09]: Added `return null` after resolve/reject calls to prevent Bluebird warnings.
- v2.0.7 [2016-02-09]: Added `es5dist` for older versions of node. Packages updated.
- v2.0.6 [2016-01-28]: Added failure unit tests.
- v2.0.5 [2016-01-26]: Refactor blob-store.js for minor performance improvement.
- v2.0.4 [2016-01-24]: Minor performance improvements and bug fixes.
- v2.0.3 [2016-01-22]: Added unit tests and minor fix.
- v2.0.2 [2016-01-19]: Added [standard][js-standard-url] to package.json.
- v2.0.1 [2016-01-12]: Minor performance improvements and bug fixes.
- v2.0.0 [2016-01-08]: Added support for [CUID][cuid-url] or [UUID][uuid-url] directory and file names.
- v1.0.1 [2016-01-07]: Last release of v1. Work on v2.0.0 to support cuid.
- v1.0.0 [2016-01-05]: Minor delint and README updates. Bump to v1.0 for future changes.
- v0.4.1 [2015-08-20]: Fix reference error.
- v0.4.0 [2015-08-16]: Changed read and write to createReadStream and createWriteStream.
- v0.3.1 [2015-08-16]: Fix write stream event order.
- v0.3.0 [2015-08-16]: Removed file path function, change of plans.
- v0.2.0 [2015-08-16]: Added file path function.
- v0.1.0 [2015-09-30]: Initial release.

## License

MIT

[sbs-url]: https://github.com/grantcarthew/node-scalable-blob-store
[mrblobby-image]: https://cdn.rawgit.com/grantcarthew/node-scalable-blob-store/master/mrblobby.svg
[amazones3-url]: https://aws.amazon.com/s3/
[googlecloud-url]: https://cloud.google.com/storage/
[azurestorage-url]: https://azure.microsoft.com/en-us/services/storage/
[filestorage-url]: https://github.com/petersirka/node-filestorage
[glusterfs-url]: http://www.gluster.org/
[uuid-url]: https://www.npmjs.com/package/uuid
[cuid-url]: https://github.com/ericelliott/cuid
[objectid-url]: https://docs.mongodb.com/manual/reference/method/ObjectId/
[ulid-url]: https://github.com/ulid/javascript
[awesome-url]: https://github.com/grantcarthew/awesome-unique-id
[nodefs-url]: https://nodejs.org/api/fs.html#fs_class_fs_stats
[wikistat-url]: https://en.wikipedia.org/wiki/Stat_(system_call)
[readstream-url]: https://nodejs.org/api/stream.html#stream_class_stream_readable
[writestream-url]: https://nodejs.org/api/stream.html#stream_class_stream_writable
[patreon-image]: https://img.shields.io/badge/patreon-donate-yellow.svg
[patreon-url]: https://www.patreon.com/grantcarthew
[nodei-npm-image]: https://nodei.co/npm/scalable-blob-store.png?downloads=true&downloadRank=true&stars=true
[nodei-npm-url]: https://nodei.co/npm/scalable-blob-store/
[cuid-discuss-url]: https://github.com/ericelliott/cuid/issues/22
[actions-url]: https://github.com/grantcarthew/node-scalable-blob-store/actions
[tap-url]: https://node-tap.org/
