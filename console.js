'use strict';
var fstring = require('util').format
var RED = '\u001b[31m'
var GREEN = '\u001b[32m'
var YELLOW = '\u001b[33m'
var WHITE = '\u001b[39m'
var MAGENTA = '\u001b[35m'
var STR = 'string'
var OBJ = 'object'
var INDENT = '  '
var SPACE = ' '
var NEW_LN = '\n'
var PREFIX = '[dev]'
var MAX_PADDING = '00000000'
var slice = Array.prototype.slice

function zpad(num, len) {
  return (MAX_PADDING.substr(0, len) + num).slice(-len)
}

function timestamp() {
  var time = new Date()
  return [
    zpad(time.getHours(), 2),
    zpad(time.getMinutes(), 2),
    zpad(time.getSeconds(), 2),
    zpad(time.getMilliseconds(), 3)
  ].join(':')
}

function createLogger(color) {
  return function prettyPrint(data) {
    if (typeof data === STR)
      data = null
    var extra = slice.call(arguments, data ? 1 : 0)
    var msg = fstring.apply(null, extra)
    var prettyData =
      (data instanceof Error)
        ? NEW_LN + data.stack
      : (data && typeof data === OBJ)
        ? JSON.stringify(data, null, INDENT).slice(1, -2)
      : ''
    process.stdout.write([
      timestamp(), SPACE, color, PREFIX, SPACE, msg, WHITE, prettyData, NEW_LN
    ].join(''))
  }
}

module.exports = {
  trace: createLogger(WHITE),
  debug: createLogger(MAGENTA),
  info: createLogger(GREEN),
  warn: createLogger(YELLOW),
  error: createLogger(RED)
}
