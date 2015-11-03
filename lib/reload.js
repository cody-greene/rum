'use strict';
let spawn = require('child_process').spawn
let watch = require('node-watch')
let liveSocket = null
let proc = null
const PING_INTERVAL = 60000
const RETRY_INTERVAL = 1000

/**
 * Chunked encoding disabled: http://www.w3.org/TR/2009/WD-eventsource-20091029/#notes
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function serveEventStream(req, res) {
  liveSocket = res
  liveSocket.writeHead(200, {
    'Transfer-Encoding': 'identity',
    'Content-Type': 'text/event-stream'
  })
  liveSocket.write('retry:' + RETRY_INTERVAL + '\n')
  liveSocket.on('close', onClose)
}

function onClose(){ liveSocket = null }

function onExit() {
  proc = null
  if (liveSocket) liveSocket.write('event: reload\ndata:\n\n')
}

/**
 * Use this periodically to keep the socket open
 */
function ping() {
  if (liveSocket) liveSocket.write(':ping\n')
}

/**
 * During development this module will watch our source files for updates,
 * rebuild the project, and politely ask the browser to refresh
 * @param {string} src Directory of source files to watch
 * @param {string} cmd Command to execute when source files are disturbed
 * @param {string[]} params Options for `cmd`
 * @return {function} handler(req, res)
 */
function createReloadMiddleware(opt) {
  function rebuild() {
    proc = spawn(opt.cmd, opt.params, {stdio: 'inherit'}).on('exit', onExit)
  }
  setInterval(ping, PING_INTERVAL)
  watch(opt.src, function onUpdate() {
    // Make sure there's only one listener, even when this is called multiple times
    // e.g. rapid updates before the cmd process can exit
    if (proc) proc.removeAllListeners('exit').on('exit', rebuild).kill()
    else rebuild()
  })
  return serveEventStream
}

module.exports = createReloadMiddleware
