const test = require('tape')
const mock = require('mock-fs')
const fsBlobItemList = require('../src/fs-blob-item-list')
const cuidValidator = require('../src/id-validator')('cuid')
const uuidValidator = require('../src/id-validator')('uuid')

const mockFsConfig = {
  '/blobs/cijnrl8iu0000jph3r3cg96w1': 'data',
  '/blobs/cijnrm2ou0001jph3g3upqu6k': 'data',
  '/blobs/cijnrmu9y0002jph3gp68qaph': {},
  '/blobs/cijnrpxbi0003jph3r5k30b3a': {},
  '/blobs/wrongnamefile': 'data',
  '/blobs/wrongnamedir': {},
  '/blobs/574e9ed7-f99d-4c3b-8ed8-7340ae42f669': 'data',
  '/blobs/6a890577-b6e3-40aa-9140-4a0f98912482': 'data',
  '/blobs/efcecc00-a6a7-4871-bd94-c54814bd3d80': {},
  '/blobs/3a60e19f-7d1f-4d19-8ca5-9c0882c2f64a': {}
}

test('fs-blob-item-list tests', t => {
  mock(mockFsConfig)

  t.plan(8)
  return fsBlobItemList('/blobs', cuidValidator, true)
  .then(list => {
    t.equal(list.length, 2, 'List two CUID directories')
  }).then(() => {
    return fsBlobItemList('/blobs', uuidValidator, true)
  }).then(list => {
    t.equal(list.length, 2, 'List two UUID directories')
  }).then(() => {
    return fsBlobItemList('/blobs', cuidValidator, false)
  }).then(list => {
    t.equal(list.length, 2, 'List two CUID files')
  }).then(() => {
    return fsBlobItemList('/blobs', uuidValidator, false)
  }).then(list => {
    t.equal(list.length, 2, 'List two UUID files')
  }).then(() => {
    return fsBlobItemList('/wrongdir', cuidValidator, true)
  }).then(list => {
    t.ok(Array.isArray(list), 'Invalid dir returns array')
    t.equal(list.length, 0, 'Invalid dir returns empty array')
  }).then(() => {
    return fsBlobItemList('/wrongdir', cuidValidator, false)
  }).then(list => {
    t.ok(Array.isArray(list), 'Invalid dir for files returns array')
    t.equal(list.length, 0, 'Invalid dir for files returns empty array')
  }).then(() => {
    mock.restore()
  })
})
