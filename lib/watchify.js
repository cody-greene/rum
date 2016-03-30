'use strict'
const chokidar = require('chokidar')
const path = require('path')
const TransformStream = require('stream').Transform

/**
 * Simplified version of substack/watchify
 * - modified to use a single watcher object
 * - once added to the watchlist, files are never removed
 * - this allows the build to be properly debounced by another module
 * - removed extra dependencies
 * @param {EventEmitter} browserify bundler
 * @return {EventEmitter} The chokidar file watcher
 */
module.exports = function watchify(browserify) {
  // Browserify will pull from the cache, but won't modify it
  // So this module needs to add files to the cache object and delete them when invalid
  const cache = browserify._options.cache
  const pkgcache = browserify._options.packageCache
  const cacheIds = new Map()

  // chokidar@1.4.3:
  // - if both src/index.js and /home/user/rum/src/index.js are added
  // - then two "update" events will fire on the same file
  const absoluteEntries = browserify._options.entries.map(file => path.resolve(process.cwd(), file))
  const watcher = chokidar.watch(absoluteEntries, {
    atomic: false, // Debounce manually
    ignoreInitial: true,
    ignored: ['**/node_modules/**', '**/bower_components/**']
  })

  const collect = createCollector(browserify, cache)

  watcher.on('change', function (file) {
    const id = cacheIds.get(file)
    browserify.once('reset', function () {
      // Avoid modifying the cache during a build
      // Instead, queue up any invalidations to run right before the next build
      delete cache[id]
      delete pkgcache[id]
    })
  })

  browserify.on('file', function (file) {
    watchFile(file)
  })
  .on('package', function (pkg) {
    const file = path.join(pkg.__dirname, 'package.json')
    watchFile(file)
    pkgcache[file] = pkg
  })
  .on('transform', function (tr, file) {
    tr.on('file', function (dep){ watchFile(file, dep) })
    // TODO .on('package') ?
  })
  .on('reset', collect)

  collect()

  function watchFile(id, dep) {
    dep = dep || id
    // Once a file is added to the watch list it is never removed
    watcher.add(dep)
    cacheIds.set(dep, id)
  }

  return watcher
}

/**
 * @param {object} browserify
 * @param {object} cache
 * @return {function} collect() Begin adding files to the cache
 */
function createCollector(browserify, cache) {
  function transform(row, _, next) {
    const id = row.expose ? browserify._expose[row.id] : row.file
    cache[id] = {
      source: row.source,
      deps: Object.assign({}, row.deps)
    }
    next(null, row)
  }
  return function collect() {
    browserify.pipeline.get('deps').push(through(transform))
  }
}

/**
 * Quickly create a object-mode duplex stream
 * @param {function} transform(chunk, encoding, done)
 */
function through(transform) {
  const stream = new TransformStream({
    readableObjectMode: true,
    writableObjectMode: true
  })
  stream._transform = transform
  return stream
}
