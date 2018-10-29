const fs = require('fs')
const del = require('del')
const ulid = require('ulid').ulid
const utils = require('./test-utils')
const parser = require('../src/options-parser')
const blobRoot = utils.genBlobStoreRoot('options-parser')
const options = {}
const optsCuidDefaults = {
  blobStoreRoot: blobRoot,
  idFunction: ulid,
  dirDepth: 3,
  dirWidth: 1000
}

describe('options-parser tests', () => {
  test('options-parser tests', async () => {
    expect.assertions(10)
    expect(() => parser()).toThrow()
    expect(() => parser('string')).toThrow()
    expect(() => parser(options)).toThrow()
    options.blobStoreRoot = blobRoot
    expect(() => parser(options)).toThrow()
    options.idFunction = 'invalid'
    expect(() => parser(options)).toThrow()
    options.idFunction = () => 123
    expect(() => parser(options)).toThrow()
    options.idFunction = ulid
    options.dirDepth = 0
    expect(() => parser(options)).toThrow()
    options.dirDepth = 11
    expect(() => parser(options)).toThrow()
    delete options.dirDepth
    expect(parser(options)).toEqual(optsCuidDefaults)
    expect(fs.existsSync(options.blobStoreRoot)).toBe(true)
  })
})
