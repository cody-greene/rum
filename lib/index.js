'use strict';
let http = require('http')
let resolvePath = require('path').resolve
let createStaticMiddleware = require('connect-gzip-static')
let createFaviconMiddleware = require('./favicon')
let createReloadMiddleware = require('./reload')

/**
 * @param {string} opt.dist
 * @param {string} opt.favicon
 * @param {number} opt.port
 * See ./reload.js for more options
 */
function createDevServer(opt) {
  let serveDist = createStaticMiddleware(opt.dist)
  let serveReloader = createReloadMiddleware(opt)
  let serveFavicon = createFaviconMiddleware(opt.favicon)
  http.createServer()
  .on('request', function (req, res) {
    switch (req.url) {
      case '/favicon.ico':
        serveFavicon(req, res)
      break
      case '/reload-stream':
        serveReloader(req, res)
      break
      default: serveDist(req, res, function (err) {
        res.statusCode = err ? 500 : 404
        res.end(http.STATUS_CODES[res.statusCode] + '\n')
      })
    }
  })
  .listen(opt.port, function () {
    let actualPort = this.address().port
    console.log('Serving %s at http://localhost:%s', resolvePath(opt.dist), actualPort)
  })
}

module.exports = createDevServer
