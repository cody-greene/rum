'use strict'
/* eslint-disable no-console */
const http = require('http')
const parseURL = require('url').parse
const extname = require('path').extname
const serveStatic = require('serve-static')
const createBuildManager = require('./build-manager')

function createDevMiddleware(opt) {
  const serveOther = opt.serverRoot && serveStatic(opt.serverRoot, {
    acceptRanges: false,
    etag: false,
    cacheControl: false,
    setHeaders(res) {
      res.setHeader('Cache-Control', 'no-cache')
    }
  })
  const man = createBuildManager(opt)
  const handler = (req, res) => {
    if (req.url === '/.esthulu') {
      man.middleware(req, res)
    } else if (!serveOther) {
      res.statusCode = 404
      res.end()
      return
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
  }
  return {handler, man}
}

/**
 * @param {string} opt.serverRoot
 * @param {number} opt.port
 * @param {string} opt.router
 * options are passed along to createBuildManager()
 */
function createDevServer(opt) {
  const {handler, man} = createDevMiddleware(opt)
  const server = http.createServer().on('request', handler)

  // Wait for the first complete build cycle before starting the server
  man.once('ready', function () {
    server.listen(opt.port, opt.addr, function () {
      let addr = opt.addr
      if (!opt.addr || opt.addr === '0.0.0.0') {
        addr = 'localhost'
        console.log('[esthulu] (bound to all interfaces)')
      }
      console.log('[esthulu] Running at http://%s:%s', addr, this.address().port)
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

module.exports = (raw) => { createDevServer(normalizeOptions(raw)) }

module.exports.createDevMiddleware = (raw) => createDevMiddleware(normalizeOptions(raw))
