'use strict'
/**
 * When included in a development build this module will listen for server-sent
 * events and refresh the page automatically.
 */
/* eslint-env browser */
var EventEmitter = require('events')
var events = new EventEmitter()

function log(msg) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined') {
    if (console.warn) console.warn(msg)
    else console.log(msg)
  }
}

if (typeof EventSource !== 'undefined') {
  var src = new EventSource(location.origin + '/.rum')
  log('auto-refresh enabled')
  src.errcount = 0
  src.addEventListener('reload', function (evt) {
    if (events.listenerCount('reload')) events.emit('reload', JSON.parse(evt.data))
    else location.reload(true)
  })
  src.addEventListener('build-error', function (evt) {
    log('build failed; ' + evt.data)
    events.emit('build-error', new Error(evt.data))
  })
  src.addEventListener('error', function () {
    if (++this.errcount > 5) {
      log('closing auto-refresh connection')
      this.close()
    }
  })
}
else log('EventSource not supported; auto-refresh disabled')

module.exports = events
