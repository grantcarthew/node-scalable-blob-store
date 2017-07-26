const os = require('os')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const del = require('del')
const test = require('tape')
const fsBlobDirLatest = require('../dist/fs-blob-dir-latest')
const cuidValidator = require('../dist/id-validator')('cuid')
const uuidValidator = require('../dist/id-validator')('uuid')
const utils = require('./test-utils')
const blobRoot = utils.blobRoot('fs-blob-dir-latest')
const cuids = utils.generateCuids(4)
const uuids = utils.generateUuids(4)

module.exports = async function fsBlobDirLatestSpec () {
  test('fs-blob-dir-latest tests', async function (t) {

    try {
      await utils.mkBlobDir(blobRoot)
      await utils.createBlobFile(blobRoot, cuids[0])
      await utils.mkBlobDir(blobRoot, cuids[1])
      await utils.createBlobFile(blobRoot, uuids[0])
      await utils.mkBlobDir(blobRoot, uuids[1])
      await utils.delay(200)
      await utils.createBlobFile(blobRoot, cuids[2])
      await utils.mkBlobDir(blobRoot, cuids[3])
      await utils.createBlobFile(blobRoot, uuids[2])
      await utils.mkBlobDir(blobRoot, uuids[3])
    } catch (err) {
      console.error(err)
    }
    t.plan(3)
    let dir
    dir = await fsBlobDirLatest(blobRoot, cuidValidator)
    t.equal(dir, cuids[3], 'Return newest CUID directory')
    dir = await fsBlobDirLatest(blobRoot, uuidValidator)
    t.equal(dir, uuids[3], 'Return newest UUID directory')
    dir = await fsBlobDirLatest('/', cuidValidator)
    t.notOk(dir, 'Return false if invalid directory')

    blobRoot.startsWith('/tmp') && await del(blobRoot, {force: true})
  })
}

