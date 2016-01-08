const uuid = require('node-uuid')
const cuid = require('cuid')

module.exports = function (idType) {
  if (idType === 'uuid') {
    return function () {
      return uuid.v4()
    }
  }

  return function () {
    return cuid()
  }
}
