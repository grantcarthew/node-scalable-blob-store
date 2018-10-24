const test = require('tape')
const fsBlobItemList = require('../dist/fs-blob-item-list')
const cuidValidator = require('../dist/id-validator')('cuid')
const uuidValidator = require('../dist/id-validator')('uuid')
const utils = require('./test-utils')
const blobRoot = utils.blobRoot('fs-blob-item-list')

module.exports = async function fsBlobItemListSpec () {
  test('fs-blob-item-list tests', async function (t) {
    try {
      await utils.buildTestFs(blobRoot)

      t.plan(8)
      let item
      item = await fsBlobItemList(blobRoot, cuidValidator, true)
      t.equal(item.length, 2, 'Return two CUID directories')
      item = await fsBlobItemList(blobRoot, uuidValidator, true)
      t.equal(item.length, 2, 'Return two UUID directories')
      item = await fsBlobItemList(blobRoot, cuidValidator, false)
      t.equal(item.length, 2, 'Return two CUID files')
      item = await fsBlobItemList(blobRoot, uuidValidator, false)
      t.equal(item.length, 2, 'Return two UUID files')
      item = await fsBlobItemList('/wrongdir', cuidValidator, true)
      t.ok(Array.isArray(item), 'Return array if invalid directory')
      t.equal(item.length, 0, 'Return empty array if invalid directory')
      item = await fsBlobItemList('/wrongdir', cuidValidator, false)
      t.ok(Array.isArray(item), 'Return array if listing files on invalid directory')
      t.equal(item.length, 0, 'Return empty array if listing files on invalid directory')

      await utils.rmBlobDir(blobRoot)
    } catch (err) {
      console.error(err)
    }
  })
}
