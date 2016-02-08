'use strict';

module.exports = function (idType) {
  if (idType === 'uuid') {
    return function (testId) {
      var uuidRegEx = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
      return uuidRegEx.test(testId);
    };
  }

  return function (testId) {
    var cuidRegEx = /^c[^\s-]{8,}$/;
    return cuidRegEx.test(testId);
  };
};