'use strict'
const PING_INTERVAL = 60000
const RETRY_INTERVAL = 1000

/**
 * client.middleware(req, res) Serve the client with a long-lived EventStream
 * client.reload(err) Send a "reload" or "build-error" event to a connected client
 * client.close() Prepare for shutdown by clearing any timers
 */
function createEventStream() {
  const pingTimer = setInterval(ping, PING_INTERVAL)
  let liveSocket = null

  /**
   * Chunked transfer-encoding disabled: http://www.w3.org/TR/2009/WD-eventsource-20091029/#notes
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  function middleware(_, res) {
    liveSocket = res
    liveSocket.writeHead(200, {
      'Transfer-Encoding': 'identity',
      'Content-Type': 'text/event-stream'
    })
    liveSocket.write('retry:' + RETRY_INTERVAL + '\n')
    liveSocket.on('close', onSocketClose)
  }

  function onSocketClose(){ liveSocket = null }

  /** Tell the client to reload */
  function reload(err, files) {
    if (err) emit('build-error', err)
    else emit('reload', JSON.stringify(files))
  }

  function emit(name, payload) {
    if (liveSocket) liveSocket.write(`event: ${name}\ndata: ${payload}\n\n`)
  }

  /** Use this periodically to keep the socket open */
  function ping() {
    if (liveSocket) liveSocket.write(':ping\n')
  }

  function close() {
    clearInterval(pingTimer)
  }

  return {middleware, reload, close, emit}
}

module.exports = createEventStream
