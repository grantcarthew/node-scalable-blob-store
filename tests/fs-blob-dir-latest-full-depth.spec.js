const os = require('os')
const test = require('tape')
const fsBlobDirLatestFullDepth = require('../dist/fs-blob-dir-latest-full-depth')
const idValidator = require('../dist/id-validator')
const idGenerator = require('../dist/id-generator')

const stateCuid = {
  blobStoreRoot: '/blobs',
  idType: 'cuid',
  dirDepth: 3,
  dirWidth: 1000,
  validateId: idValidator('cuid'),
  newId: idGenerator('cuid')
}
const stateUuid = {
  blobStoreRoot: '/blobs',
  idType: 'uuid',
  dirDepth: 3,
  dirWidth: 1000,
  validateId: idValidator('uuid'),
  newId: idGenerator('uuid')
}

const currentFsConfig = {
  content: 'oldest birthtime',
  birthtime: new Date()
}
const oldFsConfig = {
  content: 'old birthtime',
  birthtime: new Date('2015/01/01')
}

const mock = {}
mock.directory = () => {}
mock.file = () => {}
const mockFsConfig = {
  '/blobs/cijownavg0000z9h3khpjxieo': mock.directory(currentFsConfig),
  '/blobs/cijownavg0000z9h3khpjxieo/cijownavj0001z9h3ltkiynq7': mock.directory(currentFsConfig),
  '/blobs/cijownavg0000z9h3khpjxieo/cijownavj0001z9h3ltkiynq7/cijownavj0002z9h3lwuin2gr': mock.directory(currentFsConfig),
  '/blobs/cijownavg0000z9h3khpjxieo/cijownavj0001z9h3ltkiynq7/cijownavj0002z9h3lwuin2gr/cijownef200cmz9h35ph9hfyq': mock.directory(currentFsConfig),
  '/blobs/cijnrm2ou0001jph3g3upqu6k': mock.file(oldFsConfig),
  '/blobs/cijnrmu9y0002jph3gp68qaph': mock.directory(oldFsConfig),
  '/blobs/cijnrmu9y0002jph3gp68qaph/cijownbl70057z9h3uqy30hb9': mock.directory(oldFsConfig),
  '/blobs/cijnrmu9y0002jph3gp68qaph/cijownbl70057z9h3uqy30hb9/cijownblf0058z9h3ym2626pu': mock.directory(oldFsConfig),
  '/blobs/cijnrmu9y0002jph3gp68qaph/cijownbl70057z9h3uqy30hb9/cijownblf0058z9h3ym2626pu/cijownbmz005ez9h3mdbykls8': mock.directory(oldFsConfig),
  '/blobs/wrongnamefile': 'newest file',
  '/blobs/wrongnamedir': {},
  '/blobs/574e9ed7-f99d-4c3b-8ed8-7340ae42f669': mock.directory(currentFsConfig),
  '/blobs/574e9ed7-f99d-4c3b-8ed8-7340ae42f669/77dc7904-8f3a-4847-95b8-61a12306716a': mock.directory(currentFsConfig),
  '/blobs/574e9ed7-f99d-4c3b-8ed8-7340ae42f669/77dc7904-8f3a-4847-95b8-61a12306716a/d6ec2294-4435-4fbf-97b2-b953fb5b9a89': mock.directory(currentFsConfig),
  '/blobs/574e9ed7-f99d-4c3b-8ed8-7340ae42f669/77dc7904-8f3a-4847-95b8-61a12306716a/d6ec2294-4435-4fbf-97b2-b953fb5b9a89/135363c4-d8fb-4309-ad73-8ddd5b890e05': mock.directory(currentFsConfig),
  '/blobs/6a890577-b6e3-40aa-9140-4a0f98912482': mock.file(oldFsConfig),
  '/blobs/efcecc00-a6a7-4871-bd94-c54814bd3d80': mock.directory(oldFsConfig),
  '/blobs/efcecc00-a6a7-4871-bd94-c54814bd3d80/8e25df8f-09e3-4e8e-88e9-11262e80add5': mock.directory(oldFsConfig),
  '/blobs/efcecc00-a6a7-4871-bd94-c54814bd3d80/8e25df8f-09e3-4e8e-88e9-11262e80add5/ce94994a-ed0d-40b1-a0cf-17fcaa00af18': mock.directory(oldFsConfig),
  '/blobs/efcecc00-a6a7-4871-bd94-c54814bd3d80/8e25df8f-09e3-4e8e-88e9-11262e80add5/ce94994a-ed0d-40b1-a0cf-17fcaa00af18/a603cc87-9742-436a-935a-2ca11dc0151c': mock.directory(oldFsConfig)
}

const newestCuid = '/cijownavg0000z9h3khpjxieo/cijownavj0001z9h3ltkiynq7/cijownavj0002z9h3lwuin2gr'
const newestUuid = '/574e9ed7-f99d-4c3b-8ed8-7340ae42f669/77dc7904-8f3a-4847-95b8-61a12306716a/d6ec2294-4435-4fbf-97b2-b953fb5b9a89'

module.exports = async function fsBlobDirLatestFullDepthSpec () {
  test('fs-blob-dir-latest-full-depth tests', async function (t) {
    mock(mockFsConfig)

    t.plan(4)
    let dir
    dir = await fsBlobDirLatestFullDepth(stateCuid)
    t.equal(dir, newestCuid, 'Return newest CUID directory')
    dir = await fsBlobDirLatestFullDepth(stateUuid)
    t.equal(dir, newestUuid, 'Return newest UUID directory')
    stateCuid.blobStoreRoot = '/emptyCuidBlobStoreRoot'
    dir = await fsBlobDirLatestFullDepth(stateCuid)
    t.equal(dir.split('/').length - 1, 3, 'Return new CUID directory')
    stateUuid.blobStoreRoot = '/emptyUuidBlobStoreRoot'
    dir = await fsBlobDirLatestFullDepth(stateCuid)
    t.equal(dir.split('/').length - 1, 3, 'Return new UUID directory')

  })
}
