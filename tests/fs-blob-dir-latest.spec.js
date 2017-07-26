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
const cuids = [
  'cijnrl8iu0000jph3r3cg96w1',
  'cijnrm2ou0001jph3g3upqu6k',
  'cijnrmu9y0002jph3gp68qaph',
  'cijnrpxbi0003jph3r5k30b3a'
]

const uuids = [
  '574e9ed7-f99d-4c3b-8ed8-7340ae42f669',
  '6a890577-b6e3-40aa-9140-4a0f98912482',
  'efcecc00-a6a7-4871-bd94-c54814bd3d80',
  '3a60e19f-7d1f-4d19-8ca5-9c0882c2f64a'
]

module.exports = async function fsBlobDirLatestSpec () {
  test('fs-blob-dir-latest tests', async function (t) {
    const blobRoot = await utils.blobRoot('fs-blob-dir-latest')

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
      await del(blobRoot)
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

  })
}

