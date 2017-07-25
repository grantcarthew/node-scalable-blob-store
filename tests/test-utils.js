const os = require('os')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')

module.exports.blobRoot = async function blobRoot (name) {
  let root = path.join(os.tmpdir(), 'blobs')
  !fs.existsSync(rootPath) && await mkdir(rootPath)
  rootPath = path.join(rootPath, name)
  !fs.existsSync(rootPath) && await mkdir(rootPath)
  return rootPath
}
module.exports.mkBlobDir = async function mkBlobDir (dirPath) {
  !fs.existsSync(dirPath) && await mkdir(dirPath)
}

module.exports.createBlobFile = function createBlobFile (filePath) {
  return writeFile(filePath, 'abcdefghijklmnopqrstuvwxyz')
}

module.exports.delay = function delay (ms) {
  return new Promise.delay(ms)
}
