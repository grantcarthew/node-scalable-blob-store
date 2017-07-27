const test = require('tape')
const fsBlobDirLatest = require('../dist/fs-blob-dir-latest')
const cuidValidator = require('../dist/id-validator')('cuid')
const uuidValidator = require('../dist/id-validator')('uuid')
const utils = require('./test-utils')
const blobRoot = utils.blobRoot('fs-blob-dir-latest')

module.exports = async function fsBlobDirLatestSpec () {
  test('fs-blob-dir-latest tests', async function (t) {
    try {
      const blobFs = await utils.buildTestFs(blobRoot)

      t.plan(3)
      let dir
      dir = await fsBlobDirLatest(blobRoot, cuidValidator)
      t.equal(dir, blobFs.newestCuid.split('/')[1], 'Return newest CUID directory')
      dir = await fsBlobDirLatest(blobRoot, uuidValidator)
      t.equal(dir, blobFs.newestUuid.split('/')[1], 'Return newest UUID directory')
      dir = await fsBlobDirLatest('/', cuidValidator)
      t.notOk(dir, 'Return false if invalid directory')

      await utils.rmBlobDir(blobRoot)
    } catch (err) {
      console.error(err)      
    }
  })
}

