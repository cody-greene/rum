'use strict'
/* eslint-disable no-console */
const http = require('http')
const parseURL = require('url').parse
const resolvePath = require('path').resolve
const extname = require('path').extname
const createStaticMiddleware = require('connect-gzip-static')
const createBuildManager = require('./build-manager')

/**
 * @param {string} opt.serverRoot
 * @param {number} opt.port
 * @param {string} opt.router
 * options are passed along to createBuildManager()
 */
function createDevServer(opt) {
  const serveOther = createStaticMiddleware(opt.serverRoot)
  const man = createBuildManager(opt)
  const server = http.createServer().on('request', function (req, res) {
    if (req.url === '/.rum') {
      man.middleware(req, res)
    } else {
      if (opt.router && !extname(parseURL(req.url).pathname)) {
        req.url = opt.router
      }
      serveOther(req, res, function (err) {
        if (err) {
          res.statusCode = 500
          res.end(err.toString() + '\n')
        } else {
          res.statusCode = 404
          res.end()
        }
      })
    }
  })

  // Wait for the first complete build cycle before starting the server
  man.once('ready', function () {
    server.listen(opt.port, opt.addr, function () {
      let addr = opt.addr
      if (!opt.addr || opt.addr === '0.0.0.0') {
        addr = 'localhost'
        console.log('[rum] (bound to all interfaces)')
      }
      console.log('[rum] Serving %s at http://%s:%s',
        resolvePath(opt.serverRoot), addr, this.address().port)
    })
  })
}

function normalizeOptions(opt) {
  const norm = {
    port: opt.port, // ?string
    addr: opt.addr, // ?string
    router: opt.router, // ?string
    serverRoot: opt.serverRoot, // ?string
    jobs: opt.jobs ?? [], // Array<{cmd?: string, pattern?: string}>
    esbuildOptions: opt.esbuildOptions ?? {}
  }
  if (typeof opt.addr == 'string' && opt.addr.includes(':')) {
    const [addr, port] = opt.addr.split(':')
    norm.addr = addr || null
    norm.port = port || null
  }
  return norm
}

module.exports = function (opt) {
  if (opt.serverRoot) createDevServer(normalizeOptions(opt))
  else createBuildManager(normalizeOptions(opt))
}
