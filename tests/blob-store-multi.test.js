const ulid = require('ulid').ulid
const cuid = require('cuid')
const utils = require('./test-utils')
const bulkCreate = require('./bulk-create')
const blobRoot = utils.genBlobStoreRoot('blob-store-multi')

const optionsA = {
  blobStoreRoot: blobRoot + '/A',
  idFunction: ulid,
  dirDepth: 5,
  dirWidth: 10
}
const optionsB = {
  blobStoreRoot: blobRoot + '/B',
  idFunction: cuid,
  dirDepth: 5,
  dirWidth: 10
}

describe('blob-store-multi tests', () => {
  test('blob-store multi tests', async () => {
    expect.assertions(4)
    const promises = []
    promises.push(bulkCreate(optionsA, 1200))
    promises.push(bulkCreate(optionsB, 1100))
    const result = await Promise.all(promises)
    expect(result[0].totalDirectories).toBe(136)
    expect(result[0].totalFiles).toBe(1200)
    expect(result[1].totalDirectories).toBe(125)
    expect(result[1].totalFiles).toBe(1100)
    await utils.rmBlobDir(blobRoot)
  })
})
