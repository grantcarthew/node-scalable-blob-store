const test = require('tape')
const idVal = require('../src/id-validator')
const cuidVal = idVal('cuid')
const uuidVal = idVal('uuid')
var cuid = 'cijnhaaye0000xmh3mhqb60jm'
var notCuid = 'cijnhaa-ye0000xmh3mhqb60jm'
var uuid = 'd9e0b0e7-5116-4762-a81b-7c112898a26f'
var notUuid = 'd9-0b0e7-5116-4762-a81b-7c112898a26f'

test('id-validator tests', t => {
  t.plan(4)
  t.ok(cuidVal(cuid), 'CUID validates')
  t.notOk(cuidVal(notCuid), 'CUID does not validate')
  t.ok(uuidVal(uuid), 'UUID validates')
  t.notOk(uuidVal(notUuid), 'UUID does not validate')
})