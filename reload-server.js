'use strict';
var createHTTPServer = require('http').createServer
// Create a live-reload server using SSE, simplified for a single connection
// Signal a page reload with `server.reload()`
// https://developer.mozilla.org/en-US/docs/Server-sent_events
module.exports = function createReloadServer(port, readyCallback) {
  var liveSocket
  var server = createHTTPServer()
    .listen(port, readyCallback)
    .on('request', function router(req, res) {
      liveSocket = res
      res.writeHead(200, {
        'transfer-encoding': 'identity',
        'content-type': 'text/event-stream',
        'access-control-allow-origin': '*',
        'connection': 'close'
      })
      res.write('retry:1000\n')
      res.on('close', onClose)
    })

  function onClose() {liveSocket = null}

  server.reload = function sendReload() {
    if (liveSocket) liveSocket.write('event: reload\ndata:\n\n')
  }

  // Prevent a connection reset every 2 minutes by sending an empty ping
  // Save the timer ID so we can stop it for whatever reason
  server.pingTimer = setInterval(function sendPing() {
    if (liveSocket) liveSocket.write('event: ping\ndata:\n\n')
  }, 60000)

  return server
}
