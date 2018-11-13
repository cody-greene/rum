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
    if (req.url === '/.rum') man.middleware(req, res)
    else {
      if (opt.router && !extname(parseURL(req.url).pathname)) {
        req.url = opt.router
      }
      serveOther(req, res, function (err) {
        if (err) {
          res.statusCode = 500
          res.end(err.toString() + '\n')
        }
        else {
          res.statusCode = 404
          res.end()
        }
      })
    }
  })

  // Wait for the first complete build cycle before starting the server
  man.once('ready', function () {
    server.listen(opt.port, opt.addr, function () {
      /* eslint-disable no-console */
      let port = this.address().port
      let addr = opt.addr || 'localhost'
      console.log('Serving %s at http://%s:%s', resolvePath(opt.serveDirectory), addr, port)
    })
  })
}

module.exports = function (opt) {
  if (opt.serveDirectory) createDevServer(opt)
  else createBuildManager(opt)
}
