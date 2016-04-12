'use strict'
const EventEmitter = require('events')
const childProcess = require('child_process')
const chokidar = require('chokidar')
const fromCLI = require('browserify/bin/args')
const fs = require('fs')
const path = require('path')

const createClientStream = require('./client-stream')
const createWatchify = require('./watchify')
const debounce = require('./debounce')

const BUILD_DEBOUNCE_MS = 100
const CWD = process.cwd()

/**
 * During development this module will watch our source files for updates,
 * rebuild the project, and politely ask the browser to refresh
 * @param {string?} opt.exec
 * @param {string} opt.outfile
 * @param {array} opt.browserifyParams from CLI
 * @param {string?} opt.watch
 * @return {EventEmitter}
 * @event ready A build cyle has completed
 */
function createBuildManager(opt) {
  const man = new EventEmitter()
  const browserify = fromCLI(opt.browserifyParams, {cache: {}, packageCache: {}})
  const bundleWatcher = createWatchify(browserify)
  const bundle = createBundler(browserify, opt.outfile)
  const exec = opt.exec && createExecutor(opt.exec)
  const execWatcher = opt.watch && exec && chokidar.watch(opt.watch, {
    ignoreInitial: true,
    atomic: false // Handle debouncing manually
  })
  const client = createClientStream()

  // List of (unique) files updated since the last reload signal was sent
  const files = new Set()

  // bundle(), exec(), etc
  const tasks = new Set()

  // Currently active build step
  let activeTask = null

  // Begin or extend a build cycle
  const build = debounce(function () {
    if (activeTask) activeTask.removeAllListeners('exit').on('exit', run)
    else run()
  }, BUILD_DEBOUNCE_MS)

  function onError(err) {
    process.stderr.write(err.stack + '\n')
    client.reload(err)
  }

  // Execute recursively until there's no more tasks to run
  // Check after each task exits to avoid timing issues
  function run(err) {
    activeTask = null
    if (err) onError(err)
    if (tasks.size) {
      const fn = tasks.values().next().value
      tasks.delete(fn)
      activeTask = fn().on('exit', run)
    }
    else if (!err) {
      client.reload(null, Array.from(files))
      man.emit('ready')
      files.clear()
    }
  }

  // TODO multiple exec/watcher pairs
  if (execWatcher) {
    execWatcher.on('error', onError)
    .on('change', function (updated) {
      files.add(updated)
      tasks.add(exec)
      build()
    })
  }

  bundleWatcher.on('error', onError)
  .on('change', function (updated) {
    files.add(path.relative(CWD, updated))
    tasks.add(bundle)
    if (exec && !execWatcher) tasks.add(exec)
    build()
  })

  // Initial build cycle
  tasks.add(bundle)
  if (exec) tasks.add(exec)
  build()

  man.middleware = client.middleware
  return man
}

/**
 * Wrap browserify.bundle()
 * @param {object} browserify
 * @param {string} file Bundle output
 * @return {function} run() => EventEmitter
 */
function createBundler(browserify, file) {
  return function run() {
    // Coalesce the error/finish events from the bundle output stream
    // into a single "exit" event whose handler can be easily discarded/updated
    const ts = Date.now()
    const task = new EventEmitter()
    browserify.bundle()
    .on('error', next)
    .once('readable', function () {
      this.pipe(fs.createWriteStream(file))
      .on('error', next)
      .on('finish', next)
    })
    function next(err) {
      if (err) return task.emit('exit', err)
      const elapsed = ((Date.now() - ts) / 1000).toFixed(2)
      process.stdout.write(`>> created ${file} over ${elapsed}s\n`)
      task.emit('exit')
    }
    return task
  }
}

/**
 * Wrap a shell command
 * @param {string} command
 * @return {function} run() => EventEmitter
 */
function createExecutor(command) {
  return function run() {
    const ts = Date.now()
    const task = new EventEmitter()
    const proc = childProcess.exec(command).on('exit', function (err) {
      if (err) return task.emit('exit', new Error(`--exec "${command}" returned non-zero exit status: ${err}`))
      const elapsed = ((Date.now() - ts) / 1000).toFixed(2)
      process.stdout.write(`>> completed "${command}" in ${elapsed}s\n`)
      task.emit('exit')
    })
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
    return task
  }
}

module.exports = createBuildManager
