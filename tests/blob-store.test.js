const BlobStore = require('../src/blob-store')
const fs = require('fs')
const del = require('del')
const ulid = require('ulid').ulid
const utils = require('./test-utils')
const streamToString = require('./test-streamtostring')
const blobStoreRoot = utils.genBlobStoreRoot('blob-store')
const tmpBlobFile = '/data'
const testOptions = {
  blobStoreRoot,
  idFunction: ulid
}

beforeAll(async () => {
  await del(blobStoreRoot, { force: true })
  await fs.promises.mkdir(blobStoreRoot, { resursive: true })
  await fs.writeFileSync(blobStoreRoot + tmpBlobFile, utils.data)
})

describe('scalable-blob-store tests', () => {
  test('basic constructor test', async () => {
    expect.assertions(5)
    const options = {}
    expect(() => new BlobStore()).toThrow()
    expect(() => new BlobStore(options)).toThrow()
    options.blobStoreRoot = blobStoreRoot
    expect(() => new BlobStore(options)).toThrow()
    options.idFunction = ulid
    expect(new BlobStore(options)).toBeDefined()
    expect(fs.existsSync(blobStoreRoot)).toBe(true)
  })

  test('blobStore properties test', () => {
    expect.assertions(4)
    const bs = new BlobStore(testOptions)
    expect(bs.blobStoreRoot).toBe(testOptions.blobStoreRoot)
    expect(bs.idFunction).toBe(testOptions.idFunction)
    expect(bs.dirWidth).toBe(1000)
    expect(bs.dirDepth).toBe(3)
  })

  test('createWriteStream test', async () => {
    expect.assertions(3)
    const bs = new BlobStore(testOptions)
    const ws = await bs.createWriteStream()
    expect(typeof ws.blobPath).toBe('string')
    expect(typeof ws.writeStream).toBe('object')
    expect(bs.createWriteStream()).toBeDefined()
  })

  test('writeFile test', async () => {
    expect.assertions(2)
    const bs = new BlobStore(testOptions)
    const blobPath = await bs.writeFile(utils.data)
    expect(typeof blobPath).toBe('string')
    const data = await bs.readFile(blobPath)
    expect(data).toBe(utils.data)
  })

  test('appendFile test', async () => {
    expect.assertions(1)
    const bs = new BlobStore(testOptions)
    const blobPath = await bs.writeFile(utils.data)
    await bs.appendFile(blobPath, utils.data)
    const data = await bs.readFile(blobPath)
    expect(data).toBe(utils.data + utils.data)
  })

  test('copyFile test', async () => {
    expect.assertions(1)
    const bs = new BlobStore(testOptions)
    const blobPath = await bs.writeFile(utils.data)
    const dstBlobPath = await bs.copyFile(blobPath)
    const data = await bs.readFile(dstBlobPath)
    expect(data).toBe(utils.data)
  })

  test('createReadStream test', async () => {
    expect.assertions(1)
    const bs = new BlobStore(testOptions)
    const rs = await bs.createReadStream(tmpBlobFile)
    const data = await streamToString(rs)
    expect(data).toBe(utils.data)
  })

  test('readFile test', async () => {
    expect.assertions(1)
    const bs = new BlobStore(testOptions)
    const data = await bs.readFile(tmpBlobFile)
    expect(data).toBe(utils.data)
  })

  test('realPath test', async () => {
    expect.assertions(1)
    const bs = new BlobStore(testOptions)
    const realPath = await bs.realPath(tmpBlobFile)
    expect(realPath).toBe(blobStoreRoot + tmpBlobFile)
  })

  test('exists test', async () => {
    expect.assertions(2)
    const bs = new BlobStore(testOptions)
    let result = await bs.exists(tmpBlobFile)
    expect(result).toBe(true)
    result = await bs.exists('notavalidfilenameorpath')
    expect(result).toBe(false)
  })

  test('remove test', async () => {
    expect.assertions(2)
    const bs = new BlobStore(testOptions)
    const blobPath = await bs.writeFile(utils.data)
    let result = await bs.exists(blobPath)
    expect(result).toBe(true)
    await bs.remove(blobPath)
    result = await bs.exists(blobPath)
    expect(result).toBe(false)
  })

  test('stat test', async () => {
    expect.assertions(2)
    const bs = new BlobStore(testOptions)
    let result = await bs.stat(tmpBlobFile)
    expect(typeof result.birthtime).toBe('object')
    expect(Reflect.ownKeys(result).length).toBe(18)
  })
})
