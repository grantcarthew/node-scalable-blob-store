exports.isUuidV4 = function (uuid) {
  uuidRegEx = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
  return uuidRegEx.test(uuid)
}

exports.isCuid = function (cuid) {
  cuidRegEx = /^c/
  return cuidRegEx.test(cuid)
}
