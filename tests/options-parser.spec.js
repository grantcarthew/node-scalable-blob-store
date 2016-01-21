const test = require('tape')
const mock = require('mock-fs')
const fs = require('fs')
const op = require('../src/options-parser')
const options = {}
const optsCuidDefaults = {
  blobStoreRoot: '/tmp/blobs',
  idType: 'cuid',
  dirDepth: 3,
  dirWidth: 1000
}
const optsUuidDefaults = {
  blobStoreRoot: '/tmp/blobs',
  idType: 'uuid',
  dirDepth: 3,
  dirWidth: 1000
}
const optNonDefault = {
  blobStoreRoot: '/tmp/blobs',
  idType: 'cuid',
  dirDepth: 6,
  dirWidth: 6000
}

test('options-parser tests', t => {
  mock()

  t.plan(11)
  t.throws(() => { op() }, 'No options passed, throws error')
  t.throws(() => { op('string') }, 'String option passed, throws error')
  t.throws(() => { op(options) }, 'No blobStoreRoot option, throws error')
  options.blobStoreRoot = '/tmp/blobs'
  t.throws(() => { op(options) }, 'No idType option, throws error')
  options.idType = 'invalid'
  t.throws(() => { op(options) }, 'Invalid idType option, throws error')
  options.idType = 'cuid'
  options.dirDepth = 0
  t.throws(() => { op(options) }, 'Invalid min dirDepth option, throws error')
  options.dirDepth = 11
  t.throws(() => { op(options) }, 'Invalid max dirDepth option, throws error')
  delete options.dirDepth
  t.deepEqual(op(options), optsCuidDefaults, 'CUID returned options with defaults')
  options.idType = 'uuid'
  t.deepEqual(op(options), optsUuidDefaults, 'UUID returned options with defaults')
  t.ok(fs.existsSync(options.blobStoreRoot), 'blobStoreRoot path created')
  t.deepEqual(op(optNonDefault), optNonDefault, 'returned options with non-defaults')

  mock.restore()
})
