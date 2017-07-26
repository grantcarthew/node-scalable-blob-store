const os = require('os')
const fs = require('fs')
const Promise = require('bluebird')
const mkdirp = require('mkdirp')
const writeFile = Promise.promisify(fs.writeFile)
const path = require('path')
const cuid = require('cuid')
const uuid = require('uuid')

module.exports.mkBlobDir = mkBlobDir = async function mkBlobDir (blobRoot, ...dirs) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(blobRoot, ...dirs)
    mkdirp(fullPath, (err) => {
      err && reject(err)
      resolve()
    })
  })
}

module.exports.blobRoot = function blobRoot (name) {
  let rootPath = path.join(os.tmpdir(), 'blobs', name)
  return rootPath
}

module.exports.createBlobFile = async function createBlobFile (blobRoot, ...pathPart) {
  pathPart.length > 1 && await mkBlobDir(blobRoot, pathPart.slice(0, pathPart.length - 1))
  let fullPath = path.join(blobRoot, ...pathPart)
  return writeFile(fullPath, 'abcdefghijklmnopqrstuvwxyz')
}

module.exports.delay = function delay (ms) {
  return new Promise.delay(ms)
}

module.exports.generateCuids = function generateCuids (total) {
  const cuids = []
  for (let i = 0; i < total; i++) {
    cuids.push(cuid())
  }
  return cuids
}

module.exports.generateUuids = function generateUuids (total) {
  const uuids = []
  for (let i = 0; i < total; i++) {
    uuids.push(uuid.v4())
  }
  return uuids
}
