module.exports = function (idType) {
  if (idType === 'uuid') {
    return function (testId) {
      uuidRegEx = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      return uuidRegEx.test(testId)
    }
  }

  return function (testId) {
    cuidRegEx = /^c[^\s-]{8,}$/
    return cuidRegEx.test(testId)
  }
}
