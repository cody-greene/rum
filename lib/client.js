'use strict'
/**
 * When included in a development build this module will listen for server-sent
 * events and refresh the page automatically.
 */
/* eslint-env browser */
var EventEmitter = require('events')
var events = new EventEmitter()
var src = null

function log(msg) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined') {
    if (console.warn) console.warn(msg)
    else console.log(msg)
  }
}

function connect() {
  if (typeof EventSource === 'undefined') {
    log('EventSource not supported; auto-refresh disabled')
  }
  else if (!src) {
    src = new EventSource(location.origin + '/.rum')
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
        src = null
      }
    })
  }
}

function disconnect() {
  if (src) {
    log('closing auto-refresh connection')
    src.close()
    src = null
  }
}

connect()
module.exports = events
module.exports.connect = connect
module.exports.disconnect = disconnect
