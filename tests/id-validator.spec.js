const test = require('tape')
const idVal = require('../src/id-validator')
const cuidVal = idVal('cuid')
const uuidVal = idVal('uuid')
var cuid = 'cijnhaaye0000xmh3mhqb60jm'
var notCuid = 'cijnhaa-ye0000xmh3mhqb60jm'
var uuid = 'd9e0b0e7-5116-4762-a81b-7c112898a26f'
var notUuid = 'd9-0b0e7-5116-4762-a81b-7c112898a26f'

test('id-validator tests', (t) => {
  t.plan(4)
  t.ok(cuidVal(cuid), 'Validates CUID')
  t.notOk(cuidVal(notCuid), 'Validation fails on invalid CUID')
  t.ok(uuidVal(uuid), 'Validates UUID')
  t.notOk(uuidVal(notUuid), 'Validation fails on invalid UUID')
})
