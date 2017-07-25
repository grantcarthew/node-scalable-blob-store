const os = require('os')
const test = require('tape')
const idGen = require('../dist/id-generator')
const cuidGen = idGen('cuid')
const uuidGen = idGen('uuid')
var cuidRegEx = /^c[^\s-]{8,}$/
var uuidRegEx = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

module.exports = async function idGeneratorSpec () {
  test('id-generator tests', (t) => {
    t.plan(2)
    var cuid = cuidGen()
    t.ok(cuidRegEx.test(cuid), 'CUID validates against RegEx')
    var uuid = uuidGen()
    t.ok(uuidRegEx.test(uuid), 'UUID validates against RegEx')
  })
}
