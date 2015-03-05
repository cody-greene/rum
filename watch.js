// Based on https://github.com/yuanchuan/node-watch
'use strict';
var fs = require('fs')
var pp = require('path')

var isFile = isType.bind(null, 'File')
var isDir = isType.bind(null, 'Directory')
var isSym = isType.bind(null, 'SymbolicLink')

// Remember files and directories
var memo = {}

// True if this is/was a file
function byFile(name) {
  return isFile(name) || memo.hasOwnProperty(name) && delete memo[name]
}

// See https://lodash.com/docs#assign
function assign(dest, src) {
  for (var key in src) if (src.hasOwnProperty(key))
    dest[key] = src[key]
  return dest
}

function isType(type, src) {
  var stat = (type === 'SymbolicLink' ? fs.lstatSync : fs.statSync)
  if (fs.existsSync(src)) {
    memo[src] = true
    return stat(src)['is' + type]()
  }
}

function runExclusive(job) {
  function done() { runExclusive._mx = false }
  if (!runExclusive._mx) {
    runExclusive._mx = true
    // A heuristic delay of the write-to-file process
    setTimeout(job.bind(null, done), 100)
  }
}

/**
 * Get immediate subdirectories
 * @param {string} base
 * @param {function} callback Invoked for each directory
 */
function getSubdirs(base, callback) {
  if (isDir(base)) fs.readdir(base, function (err, all) {
    if (all) all.forEach(function (child) {
      var dir = pp.join(base, child)
      if (isDir(dir)) callback.call(null, dir)
    })
  })
}

// Track all recently updated files/dirs
var updatedItems = []
// Only trigger the callback for valid filenames
// but make sure to track new directories
function normalizeCall(fname, opt, callback) {
  updatedItems.push(fname)
  runExclusive(function (done) {
    updatedItems.filter(byFile).forEach(function (name) {
      if (opt.recursive && !memo.hasOwnProperty(name) && isDir(name))
        watch(callback, opt, name)
      callback(name)
    })
    updatedItems = []
    done()
  })
}

function watch(callback, opt, fpath) {
  if (isSym(fpath) && !(opt.followSymLinks && opt.maxSymLevel--))
    return
  // Due to the unstable fs.watch(), if the `fpath` is a file then
  // switch to watch its parent directory instead of watch it directly.
  // Once the logged filename matches it then triggers the callback function
  if (isFile(fpath)) {
    fs.watch(pp.resolve(fpath, '..'), opt, function (_, fname) {
      if (pp.basename(fpath) === fname)
        normalizeCall(fpath, opt, callback)
    })
  } else if (isDir(fpath)) {
    fs.watch(fpath, opt, function (_, fname) {
      if (fname)
        normalizeCall(pp.join(fpath, fname), opt, callback)
    })
    if (opt.recursive)
      getSubdirs(fpath, watch.bind(null, callback, opt))
  }
}

/**
 * Reliably watch nested files & directories (recursive by default)
 * @param {string|array} fpath Files or directories to watch
 * @param {object} [opt] Passed on to fs.watch()
 * @param {function} callback Invoked with a filename whenever there's a change
 */
module.exports = function watchVariadic(fpath, opt, callback) {
  if (typeof opt === 'function')
    callback = opt
  if (!Array.isArray(fpath))
    fpath = [fpath]
  fpath.forEach(watch.bind(null, callback, assign({
    recursive: true,
    followSymLinks: false,
    maxSymLevel: 1
  }, opt)))
}
