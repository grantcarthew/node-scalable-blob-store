# scalable-blob-store

`scalable-blob-store` is a simple local file system blob store that is designed to prevent conflicts when used with a distributed or replicated file system.

After researching file upload storage for a web application I was working on I discovered the most common solution used by web developers is to create an account with a cloud service provider and just stash all their users files there.

I researched the price of cloud storage and decided I wanted a free local version that would scale if needed.

I looked at a number of existing solutions such as [filestorage](https://github.com/petersirka/node-filestorage) but was unhappy with the scalability of these solutions. Most are only designed for a single server and would cause write conflicts if a distributed file system or cluster file system like [GlusterFS](http://www.gluster.org/) was used as the storage backend.

## How does it work?

`scalable-blob-store` does not manage the files on the disk or storage system using a database or index files. Instead, the file system itself is used to find the current storage path and maintain a reasonable number of files in its directories. It is up to you to maintain metadata about the stored files in your own database.

The reason `scalable-blob-store` is scalable is due to the naming of the directories and files. Every directory and file saved to disk is named by a generated [v4 UUID](https://github.com/broofa/node-uuid). If a replicated or cluster file system is in use the only conflict that can occur is when one server is reading a file while another is removing the same file.

Here is an example of the directory structure created by `scalable-blob-store`:
```
\blobs\846a291f-9864-40bb-aefe-f29bdc73a761 // ← Directory    File ↓   
\blobs\846a291f-9864-40bb-aefe-f29bdc73a761\..\8b86b6fe-6166-424c-aed9-8faf1e62689e
```

`scalable-blob-store` supports options to give you control over the depth of the directory structure and the width of the directories. The default options give 3 directories deep containing 1000 items giving a total storage of 1 billion files within the directory structure.

Other points of interest:
* Files are only stored at the bottom of the directory tree.
* Once the number of files in a directory reaches the `dirWidth` value, the next directory is created.
* Once the number of directories in any directory reaches the `dirWidth` value, the next parent directory is created.
* If the number of directories in the highest directory, being the blob store root, has reached the `dirWidth` vaule, the `dirWidth` value is ignored.


## Installation

```sh
$ npm install scalable-blob-store --save (not published yet!!!)
```

## Usage

Everything in `scalable-blob-store` is asynchronous and is based on Promises using the [Bluebird](https://github.com/petkaantonov/bluebird) library. There are no callbacks in the API.

```js
var sbsFactory = require('scalable-blob-store')

var options = {
  blobStoreRoot: '/your/local/root/path',
  dirDepth: 4,
  dirWidth: 1000
}

var blobStore = sbsFactory.create(options)

var fs = require('fs')
var readStream = fs.createReadStream('/path/to/input')

blobStore.write(readStream).then((blobPath) => {
  console.log(blobPath)
  // Console logs the blobPath like this. Only two UUIDs shown for brevity.
  // The root is not included. Store in your database.
  // /e6b7815a-c818-465d-8511-5a53c8276b86/aea4be6a-9e7f-4511-b394-049e68f59b02
}).catch((err) => {
  console.error(err)
})

```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

TODO: Write history

## Credits

Thanks to [Mathias Buus](https://github.com/mafintosh) for his work on [fs-blob-store](https://github.com/mafintosh/fs-blob-store).

## License

MIT
