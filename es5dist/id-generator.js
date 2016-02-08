'use strict';

var uuid = require('node-uuid');
var cuid = require('cuid');

module.exports = function (idType) {
  if (idType === 'uuid') {
    return function () {
      return uuid.v4();
    };
  }

  return function () {
    return cuid();
  };
};