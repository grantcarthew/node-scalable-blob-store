const ulid = require('ulid').ulid
const cuid = require('cuid')
const uuid = require('uuid')
const utils = require('./test-utils')
const bulkCreate = require('./bulk-create')
const blobStoreRoot = utils.genBlobStoreRoot('blob-store-bulk-create')

beforeAll(() => {
  jest.setTimeout(1000000)
})

describe('scalable-blob-store bulk create tests', () => {
  test('bulk create tests', async () => {
    const t1 = {
      blobStoreRoot: blobStoreRoot + '-t1',
      idFunction: ulid,
      dirDepth: 2,
      dirWidth: 2
    }
    const r1 = await bulkCreate(t1, 124)
    expect(r1.totalDirectories).toBe(93)
    expect(r1.totalFiles).toBe(124)
    expect(r1.totalBytes).toBe(5332)
    const s1 = r1.lastBlobPath.split('/').filter(x => x)
    expect(s1[0].length).toBe(26)
    expect(s1.length).toBe(3)

    const t2 = {
      blobStoreRoot: blobStoreRoot + '-t2',
      idFunction: cuid,
      dirDepth: 8,
      dirWidth: 2
    }
    const r2 = await bulkCreate(t2, 8)
    expect(r2.totalDirectories).toBe(12)
    expect(r2.totalFiles).toBe(8)
    expect(r2.totalBytes).toBe(344)
    const s2 = r2.lastBlobPath.split('/').filter(x => x)
    expect(s2[0].length).toBe(25)
    expect(s2.length).toBe(9)

    const t3 = {
      blobStoreRoot: blobStoreRoot + '-t3',
      idFunction: uuid.v4,
      dirDepth: 10,
      dirWidth: 2
    }
    const r3 = await bulkCreate(t3, 8)
    expect(r3.totalDirectories).toBe(14)
    expect(r3.totalFiles).toBe(8)
    expect(r3.totalBytes).toBe(344)
    const s3 = r3.lastBlobPath.split('/').filter(x => x)
    expect(s3[0].length).toBe(36)
    expect(s3.length).toBe(11)
  })
})
