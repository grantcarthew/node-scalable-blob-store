const os = require('os')
const fs = require('fs')
const Promise = require('bluebird')
const mkdir = Promise.promisify(require('mkdirp'))
const writeFile = Promise.promisify(fs.writeFile)
const rmdir = Promise.promisify(fs.rmdir)
const path = require('path')

module.exports.blobRoot = async function blobRoot (name) {
  let rootPath = path.join(os.tmpdir(), 'blobs')
  await mkdir(rootPath)
  return rootPath
}

module.exports.rmBlobRoot = async function rmBlobRoot (blobRoot) {
  return await rmdir(blobRoot)
}

module.exports.mkBlobDir = mkBlobDir = async function mkBlobDir (blobRoot, ...dirs) {
  let currentPath = blobRoot
  for (let dir of dirs) {
    let fullPath = path.join(currentPath, dir)
    !fs.existsSync(fullPath) && await fs.mkdir(fullPath)
    currentPath = fullPath
  }
}

module.exports.createBlobFile = async function createBlobFile (blobRoot, ...pathPart) {
  pathPart.length > 1 && await mkBlobDir(blobRoot, pathPart.slice(0, pathPart.length - 1))
  let fullPath = path.join(blobRoot, ...pathPart)
  return writeFile(fullPath, 'abcdefghijklmnopqrstuvwxyz')
}

module.exports.delay = function delay (ms) {
  return new Promise.delay(ms)
}
