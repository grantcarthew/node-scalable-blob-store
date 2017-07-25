const os = require('os')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const test = require('tape')
const mock = require('mock-fs')
const fsBlobDirLatest = require('../dist/fs-blob-dir-latest')
const cuidValidator = require('../dist/id-validator')('cuid')
const uuidValidator = require('../dist/id-validator')('uuid')
const writeFile = Promise.promisify(fs.writeFile)
const mkdir = Promise.promisify(fs.mkdir)
const stat = Promise.promisify(fs.stat)
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
const blobRoot = path.join(os.tmpdir(), 'blobs')

const oldestFsConfig = {
  content: 'oldest birthtime',
  birthtime: new Date('2000/01/01')
}
const oldFsConfig = {
  content: 'old birthtime',
  birthtime: new Date('2015/01/01')
}

const mockFsConfig = {
  '/blobs/cijnrl8iu0000jph3r3cg96w1': 'newest file',
  '/blobs/cijnrm2ou0001jph3g3upqu6k': mock.file(oldFsConfig),
  '/blobs/cijnrmu9y0002jph3gp68qaph': mock.directory(oldFsConfig),
  '/blobs/cijnrpxbi0003jph3r5k30b3a': mock.directory(oldestFsConfig),
  '/blobs/wrongnamefile': 'newest file',
  '/blobs/wrongnamedir': {},
  '/blobs/574e9ed7-f99d-4c3b-8ed8-7340ae42f669': 'newest file',
  '/blobs/6a890577-b6e3-40aa-9140-4a0f98912482': mock.file(oldFsConfig),
  '/blobs/efcecc00-a6a7-4871-bd94-c54814bd3d80': mock.directory(oldFsConfig),
  '/blobs/3a60e19f-7d1f-4d19-8ca5-9c0882c2f64a': mock.directory(oldestFsConfig)
}

module.exports = async function fsBlobDirLatestSpec () {
  test('fs-blob-dir-latest tests', async function (t) {

    await mkBlobDir(blobRoot)
    await createBlobFile(path.join(blobRoot, cuids[0]))
    await mkBlobDir(path.join(blobRoot, cuids[1]))
    await createBlobFile(path.join(blobRoot, uuids[0]))
    await mkBlobDir(path.join(blobRoot, uuids[1]))
    await delay(200)
    await createBlobFile(path.join(blobRoot, cuids[2]))
    await mkBlobDir(path.join(blobRoot, cuids[3]))
    await createBlobFile(path.join(blobRoot, uuids[2]))
    await mkBlobDir(path.join(blobRoot, uuids[3]))

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

