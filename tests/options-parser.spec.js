const test = require('tape')
const fs = require('fs')
const del = require('del')
const utils = require('./test-utils')
const parser = require('../dist/options-parser')
const blobRoot = utils.blobRoot('options-parser')
const options = {}
const optsCuidDefaults = {
  blobStoreRoot: blobRoot,
  idType: 'cuid',
  dirDepth: 3,
  dirWidth: 1000
}
const optsUuidDefaults = {
  blobStoreRoot: blobRoot,
  idType: 'uuid',
  dirDepth: 3,
  dirWidth: 1000
}
const optNonDefault = {
  blobStoreRoot: blobRoot,
  idType: 'cuid',
  dirDepth: 6,
  dirWidth: 6000
}

module.exports = async function optionsParserSpec () {
  test('options-parser tests', async function (t) {

    t.plan(11)
    t.throws(() => { parser() }, 'Throws error if no options passed')
    t.throws(() => { parser('string') }, 'Throws error if string option passed')
    t.throws(() => { parser(options) }, 'Throws error if no blobStoreRoot option')
    options.blobStoreRoot = blobRoot
    t.throws(() => { parser(options) }, 'Throws error if no idType option')
    options.idType = 'invalid'
    t.throws(() => { parser(options) }, 'Throws error if invalid idType option')
    options.idType = 'cuid'
    options.dirDepth = 0
    t.throws(() => { parser(options) }, 'Throws error if invalid min dirDepth option')
    options.dirDepth = 11
    t.throws(() => { parser(options) }, 'Throws error if invalid max dirDepth option')
    delete options.dirDepth
    t.deepEqual(parser(options), optsCuidDefaults, 'Return options for CUID with defaults')
    options.idType = 'uuid'
    t.deepEqual(parser(options), optsUuidDefaults, 'Return options for UUID with defaults')
    t.deepEqual(parser(optNonDefault), optNonDefault, 'Return options with non-defaults')
    t.ok(fs.existsSync(options.blobStoreRoot), 'blobStoreRoot path created')

    try {
      blobRoot.startsWith('/tmp') && await del(blobRoot, {force: true})
    } catch (err) {
      console.error(err)      
    }
  })
}