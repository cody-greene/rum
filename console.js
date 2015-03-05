'use strict';
var fstring = require('util').format
var WHITE = '\u001b[39m'
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
    if (typeof data === 'string')
      data = null
    var extra = slice.call(arguments, data ? 1 : 0)
    var msg = fstring.apply(null, extra)
    var prettyData =
      (data instanceof Error)
        ? NEW_LN + data.stack
      : (data && typeof data === 'object')
        ? JSON.stringify(data, null, '  ').slice(1, -2)
      : ''
    process.stdout.write([
      timestamp(), ' ', color, PREFIX, ' ', msg, WHITE, prettyData, NEW_LN
    ].join(''))
  }
}

module.exports = {
  trace: createLogger(WHITE),
  debug: createLogger('\u001b[35m'), // magenta
  info: createLogger('\u001b[32m'), // green
  warn: createLogger('\u001b[33m'), // yellow
  error: createLogger('\u001b[31m') // red
}
