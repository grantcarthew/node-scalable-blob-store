const os = require('os')
const test = require('tape')
const blobPathBuild = require('../dist/blob-path-build')
const idValidator = require('../dist/id-validator')
const idGenerator = require('../dist/id-generator')

const stateCuid = {
  blobStoreRoot: '/blobs',
  idType: 'cuid',
  dirDepth: 3,
  dirWidth: 1000,
  validateId: idValidator('cuid'),
  newId: idGenerator('cuid')
}
const stateUuid = {
  blobStoreRoot: '/blobs',
  idType: 'uuid',
  dirDepth: 3,
  dirWidth: 1000,
  validateId: idValidator('uuid'),
  newId: idGenerator('uuid')
}

const currentFsConfig = {
  content: 'oldest birthtime',
  birthtime: new Date()
}
const oldFsConfig = {
  content: 'old birthtime',
  birthtime: new Date('2015/01/01')
}

const mock = {}
mock.directory = () => {}
mock.file = () => {}
const mockFsConfig = {
  '/blobs/cijownavg0000z9h3khpjxieo': mock.directory(currentFsConfig),
  '/blobs/cijownavg0000z9h3khpjxieo/cijownavj0001z9h3ltkiynq7': mock.directory(currentFsConfig),
  '/blobs/cijnrm2ou0001jph3g3upqu6k': mock.file(oldFsConfig),
  '/blobs/wrongnamefile': 'newest file',
  '/blobs/wrongnamedir': {},
  '/blobs/574e9ed7-f99d-4c3b-8ed8-7340ae42f669': mock.directory(currentFsConfig),
  '/blobs/574e9ed7-f99d-4c3b-8ed8-7340ae42f669/77dc7904-8f3a-4847-95b8-61a12306716a': mock.directory(currentFsConfig),
  '/blobs/6a890577-b6e3-40aa-9140-4a0f98912482': mock.file(oldFsConfig)
}

const newestCuid = '/cijownavg0000z9h3khpjxieo/cijownavj0001z9h3ltkiynq7'
const newestUuid = '/574e9ed7-f99d-4c3b-8ed8-7340ae42f669/77dc7904-8f3a-4847-95b8-61a12306716a'

module.exports = async function blobPathBuildSpec () {
  test('blob-path-build tests', async function (t) {

    t.plan(5)
    let dir
    dir = await blobPathBuild(stateCuid)
    t.ok(dir.startsWith(newestCuid), 'Return directory that starts with current CUID directory')
    t.equal(dir.split('/').length - 1, 3, 'Return directory that is three directories deep')
    dir = await blobPathBuild(stateUuid)
    t.ok(dir.startsWith(newestUuid), 'Return directory that starts with current UUID directory')
    t.equal(dir.split('/').length - 1, 3, 'Return directory that is three directories deep')
    stateCuid.blobStoreRoot = '/emptyCuidBlobStoreRoot'
    dir = await blobPathBuild(stateCuid)
    t.equal(dir.split('/').length - 1, 3, 'Return new directory that is three directories deep')

  })
}
