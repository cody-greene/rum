'use strict'
/**
 * When included in a development build this module will listen for server-sent
 * events and refresh the page automatically.
 *
 * Usage:
 * const rum = require('rum')
 * rum.addEventListener('reload', (evt) => {
 *   console.log(evt.detail) // list of updated files
 * })
 */
/* eslint-env browser */
const events = typeof EventTarget != 'undefined' ? new EventTarget() : undefined
let src = null

events.connect = connect
events.disconnect = disconnect

function log(msg) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined') {
    console.log('[rum] ' + msg)
  }
}

function connect() {
  if (typeof EventSource === 'undefined') {
    log('EventSource not supported; auto-refresh disabled')
  } else if (!src) {
    src = new EventSource(location.origin + '/.rum')
    log('auto-refresh enabled')
    src.addEventListener('reload', function (evt) {
      // application can use evt.preventDefault() to stop refreshing the page
      let ok = true
      if (events != null) {
        ok = events.dispatchEvent(new CustomEvent('reload', {
          cancelable: true,
          detail: JSON.parse(evt.data)
        }))
      }
      if (ok) {
        log('refreshing')
        this.close()
        window.location.reload(true)
      }
    })
    src.addEventListener('build-error', function (evt) {
      log('build failed; ' + evt.data)
      if (events != null) {
        events.dispatchEvent(new CustomEvent('build-error', {detail: new Error(evt.data)}))
      }
    })
    let errcount = 0
    src.addEventListener('error', function () {
      if (++errcount > 5) {
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

export default events
