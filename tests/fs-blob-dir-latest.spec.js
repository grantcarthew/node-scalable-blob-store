const test = require('tape')
const mock = require('mock-fs')
const fsBlobDirLatest = require('../src/fs-blob-dir-latest')
const cuidValidator = require('../src/id-validator')('cuid')
const uuidValidator = require('../src/id-validator')('uuid')

const oldestConfig = {
  content: 'oldest birthtime',
  birthtime: new Date('2000/01/01')
}
const oldConfig = {
  content: 'oldest birthtime',
  birthtime: new Date('2015/01/01')
}

const mockFsConfig = {
  '/blobs/cijnrl8iu0000jph3r3cg96w1': 'newest file',
  '/blobs/cijnrm2ou0001jph3g3upqu6k': mock.file(oldConfig),
  '/blobs/cijnrmu9y0002jph3gp68qaph': mock.directory(oldConfig),
  '/blobs/cijnrpxbi0003jph3r5k30b3a': mock.directory(oldestConfig),
  '/blobs/wrongnamefile': 'newest file',
  '/blobs/wrongnamedir': {},
  '/blobs/574e9ed7-f99d-4c3b-8ed8-7340ae42f669': 'newest file',
  '/blobs/6a890577-b6e3-40aa-9140-4a0f98912482': mock.file(oldConfig),
  '/blobs/efcecc00-a6a7-4871-bd94-c54814bd3d80': mock.directory(oldConfig),
  '/blobs/3a60e19f-7d1f-4d19-8ca5-9c0882c2f64a': mock.directory(oldestConfig)
}

test('fs-blob-dir-latest tests', t => {
  mock(mockFsConfig)

  t.plan(3)
  return fsBlobDirLatest('/blobs', cuidValidator)
  .then(dir => {
    t.equal(dir, 'cijnrmu9y0002jph3gp68qaph', 'Return newest CUID directory')
  }).then(() => {
    return fsBlobDirLatest('/blobs', uuidValidator)
  }).then(dir => {
    t.equal(dir, 'efcecc00-a6a7-4871-bd94-c54814bd3d80', 'Return newest UUID directory')
  }).then(() => {
    return fsBlobDirLatest('/', cuidValidator)
  }).then(dir => {
    t.notOk(dir, 'Return false if invalid directory')
  }).then(() => {
    mock.restore()
  })
})
