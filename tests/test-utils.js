const os = require('os')
const fs = require('fs')
const Promise = require('bluebird')
const mkdirp = require('mkdirp')
const del = require('del')
const writeFile = Promise.promisify(fs.writeFile)
const path = require('path')
const cuid = require('cuid')
const uuid = require('uuid')

module.exports.data = data = 'The quick brown fox jumped over the lazy dog'

module.exports.mkBlobDir = mkBlobDir = async function mkBlobDir (blobRoot, ...dirs) {
  const fullPath = path.join(blobRoot, ...dirs)
  return new Promise((resolve, reject) => {
    mkdirp(fullPath, (err) => {
      err && reject(err)
      resolve()
    })
  })
}

module.exports.rmBlobDir = rmBlobDir
async function rmBlobDir (blobRoot, ...parts) {
  const fullPath = path.join(blobRoot, ...parts)
  return fullPath.startsWith(os.tmpdir()) && del(fullPath, {force: true})
}

module.exports.blobRoot = blobRoot
function blobRoot (name) {
  let rootPath = path.join(os.tmpdir(), 'blobs', name)
  return rootPath
}

module.exports.mkBlobFile = mkBlobFile
async function mkBlobFile (blobRoot, ...pathPart) {
  pathPart.length > 1 && await mkBlobDir(blobRoot, ...pathPart.slice(0, pathPart.length - 1))
  let fullPath = path.join(blobRoot, ...pathPart)
  return writeFile(fullPath, data)
}

module.exports.delay = delay
function delay (ms) {
  return new Promise.delay(ms)
}

module.exports.generateCuids = generateCuids
function generateCuids (total) {
  const cuids = []
  for (let i = 0; i < total; i++) {
    cuids.push(cuid())
  }
  return cuids
}

module.exports.generateUuids = generateUuids
function generateUuids (total) {
  const uuids = []
  for (let i = 0; i < total; i++) {
    uuids.push(uuid.v4())
  }
  return uuids
}

module.exports.buildTestFs = buildTestFs
async function buildTestFs (blobRoot) {
    const cuids = generateCuids(10)
    const uuids = generateUuids(10)
    const newestCuid = `/${cuids[5]}/${cuids[6]}/${cuids[7]}`
    const newestUuid = `/${uuids[5]}/${uuids[6]}/${uuids[7]}`

    try {
      await mkBlobFile(blobRoot, cuids[0], cuids[1], cuids[2], cuids[3])
      await mkBlobFile(blobRoot, uuids[0], uuids[1], uuids[2], uuids[3])
      await mkBlobFile(blobRoot, cuids[4])
      await mkBlobFile(blobRoot, uuids[4])
      await mkBlobFile(blobRoot, 'wrongnamefile')
      await mkBlobDir(blobRoot, 'wrongnamedir')
      await delay(200)
      await mkBlobFile(blobRoot, cuids[5], cuids[6], cuids[7], cuids[8])
      await mkBlobFile(blobRoot, uuids[5], uuids[6], uuids[7], uuids[8])
      await mkBlobFile(blobRoot, cuids[9])
      await mkBlobFile(blobRoot, uuids[9])
    } catch (err) {
      console.log(err) 
    }
    return { newestCuid, newestUuid }
}