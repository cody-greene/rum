'use strict'
const PING_INTERVAL = 20000
const RETRY_INTERVAL = 1000

/**
 * client.middleware(req, res) Serve the client with a long-lived EventStream
 * client.reload(err) Send a "reload" or "build-error" event to a connected client
 * client.close() Prepare for shutdown by clearing any timers
 */
function createEventStream() {
  const pingTimer = setInterval(ping, PING_INTERVAL)
  const sockets = new Set()

  /**
   * Chunked transfer-encoding disabled: http://www.w3.org/TR/2009/WD-eventsource-20091029/#notes
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  function middleware(_, res) {
    sockets.add(res)
    res.writeHead(200, {
      'Transfer-Encoding': 'identity',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream'
    })
    res.write('retry:' + RETRY_INTERVAL + '\n')
    res.on('close', onSocketClose)
  }

  function onSocketClose() {
    sockets.delete(this)
  }

  /** Tell the browser to reload, or to display an error */
  function reload(err, files) {
    if (err) emit('build-error', err)
    else emit('reload', JSON.stringify(files))
  }

  function emit(name, payload) {
    for (const socket of sockets) {
      socket.write(`event: ${name}\ndata: ${payload}\n\n`)
    }
  }

  /** keep the socket open by writing a EventSource "comment" */
  function ping() {
    for (const socket of sockets) {
      socket.write(':ping\n')
    }
  }

  function close() {
    clearInterval(pingTimer)
  }

  return {middleware, reload, close}
}

module.exports = createEventStream
