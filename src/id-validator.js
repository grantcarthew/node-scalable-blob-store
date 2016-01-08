module.exports = function (idType, testId) {
  if (idType === 'uuid') {
    uuidRegEx = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
    return uuidRegEx.test(testId)
  }
  cuidRegEx = /^c[^\s-]{8,}$/
  return cuidRegEx.test(testId)
}
