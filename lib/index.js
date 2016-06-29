'use strict'
const http = require('http')
const resolvePath = require('path').resolve
const createStaticMiddleware = require('connect-gzip-static')
const createFaviconMiddleware = require('./favicon')
const createBuildManager = require('./build-manager')

/**
 * @param {string} opt.serveDirectory
 * @param {string} opt.icon
 * @param {number} opt.port
 * options are passed along to createBuildManager()
 */
function createDevServer(opt) {
  const serveFavicon = createFaviconMiddleware(opt.icon)
  const serveOther = createStaticMiddleware(opt.serveDirectory)
  const man = createBuildManager(opt)
  const server = http.createServer()
  .on('request', function (req, res) {
    if (req.url === '/favicon.ico') serveFavicon(req, res)
    else if (req.url === '/.reload') man.middleware(req, res)
    else serveOther(req, res, function (err) {
      if (err) {
        res.statusCode = 500
        res.end(err.toString() + '\n')
      }
      else {
        res.statusCode = 404
        res.end()
      }
    })
  })

  // Wait for the first complete build cycle before starting the server
  man.once('ready', function () {
    server.listen(opt.port, function () {
      /* eslint-disable no-console */
      console.log('Serving %s at http://localhost:%s', resolvePath(opt.serveDirectory), this.address().port)
    })
  })
}

module.exports = function (opt) {
  if (opt.serveDirectory) createDevServer(opt)
  else createBuildManager(opt)
}
