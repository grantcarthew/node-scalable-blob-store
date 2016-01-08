const uuid = require('node-uuid')
const cuid = require('cuid')

module.exports = function(idType) {
  if (idType === 'uuid') {
    return uuid.v4()
  }
  return cuid()
}
