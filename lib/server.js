'use strict'
const http = require('http')
const parseURL = require('url').parse
const resolvePath = require('path').resolve
const extname = require('path').extname
const createStaticMiddleware = require('connect-gzip-static')
const createBuildManager = require('./build-manager')

/**
 * @param {string} opt.serveDirectory
 * @param {number} opt.port
 * @param {string} opt.router
 * options are passed along to createBuildManager()
 */
function createDevServer(opt) {
  const serveOther = createStaticMiddleware(opt.serveDirectory)
  const man = createBuildManager(opt)
  const server = http.createServer()
  .on('request', function (req, res) {
    if (opt.router && !extname(parseURL(req.url).pathname)) {
      req.url = opt.router
    }
    if (req.url === '/.rum') man.middleware(req, res)
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
