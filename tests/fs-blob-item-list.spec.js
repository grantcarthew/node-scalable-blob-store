const os = require('os')
const test = require('tape')
const mock = require('mock-fs')
const fsBlobItemList = require('../dist/fs-blob-item-list')
const cuidValidator = require('../dist/id-validator')('cuid')
const uuidValidator = require('../dist/id-validator')('uuid')

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

module.exports = async function fsBlobItemListSpec () {
  test('fs-blob-item-list tests', async function (t) {
    mock(mockFsConfig)

    t.plan(8)
    let item
    item = await fsBlobItemList('/blobs', cuidValidator, true)
    t.equal(item.length, 2, 'Return two CUID directories')
    item = await fsBlobItemList('/blobs', uuidValidator, true)
    t.equal(item.length, 2, 'Return two UUID directories')
    item = await fsBlobItemList('/blobs', cuidValidator, false)
    t.equal(item.length, 2, 'Return two CUID files')
    item = await fsBlobItemList('/blobs', uuidValidator, false)
    t.equal(item.length, 2, 'Return two UUID files')
    item = await fsBlobItemList('/wrongdir', cuidValidator, true)
    t.ok(Array.isArray(item), 'Return array if invalid directory')
    t.equal(item.length, 0, 'Return empty array if invalid directory')
    item = await fsBlobItemList('/wrongdir', cuidValidator, false)
    t.ok(Array.isArray(item), 'Return array if listing files on invalid directory')
    t.equal(item.length, 0, 'Return empty array if listing files on invalid directory')
    
    mock.restore()
  })
}
