'use strict'
const fs = require('fs')

/**
 * @param {string} file Location of the favicon
 * @return {function} handler(req, res)
 */
function createFaviconMiddleware(file) {
  const ICON_BUFFER = fs.readFileSync(file)
  const ICON_SIZE = ICON_BUFFER.length
  return function serveFavicon(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(req.method === 'OPTIONS' ? 200 : 405, {
        Allow: 'GET, HEAD, OPTIONS'
      })
      return res.end()
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    res.setHeader('Content-Length', ICON_SIZE)
    res.setHeader('Content-Type', 'image/x-icon')
    res.end(ICON_BUFFER)
  }
}

module.exports = createFaviconMiddleware
