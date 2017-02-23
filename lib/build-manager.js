'use strict'
const EventEmitter = require('events')
const childProcess = require('child_process')
const chokidar = require('chokidar')
const fromCLI = require('browserify/bin/args')
const fs = require('fs')
const pathlib = require('path')
const createClientStream = require('./client-stream')
const createWatchify = require('./watchify')
const BUILD_DEBOUNCE_MS = 100
const CWD = process.cwd()

/**
 * During development this module will watch our source files for updates,
 * rebuild the project, and politely ask the browser to refresh
 * @param {object[]} opt.jobs List of --watch/--exec pairs
 *        e.g. [{pattern: '', cmd: ''}]
 * @param {string} opt.outfile
 * @param {array} opt.browserifyParams from CLI
 * @return {EventEmitter}
 * @event ready A build cyle has completed
 */
function createBuildManager(opt) {
  let man = new EventEmitter()
  let browserify = fromCLI(opt.browserifyParams, {cache: {}, packageCache: {}})
  let jobsByPriority = [] // priority is inverse-index (0 is highest)
  let bundleJobs = []
  let queuedJobs = new Set()
  let extraPatterns = []

  // If the server is disabled, then we don't need an event stream
  const client = opt.serveDirectory && createClientStream()

  // List of (unique) files updated since the last reload signal was sent
  let files = new Set()

  // Currently active build step
  let activeTask = null

  // Begin or extend a build cycle
  const cycle = debounce(() => {
    if (!activeTask) run()
  }, BUILD_DEBOUNCE_MS)

  /**
   * - err.quiet: Hide the stack trace
   * - err.silent: Don't print anything to the terminal
   */
  function onError(err) {
    if (!err.silent) {
      console.error(err.quiet ? err.toString() : err.stack)
    }
    if (client) client.reload(err)
  }

  /**
   * Execute recursively until there's no more tasks to run.
   * Check after each task exits to avoid timing issues
   */
  function run(err) {
    if (err) {
      onError(err)
      if (bundleJobs.indexOf(activeTask) !== -1) {
        bundleJobs.forEach(job => queuedJobs.delete(job))
      }
    }
    activeTask = getNextJob(jobsByPriority, queuedJobs)
    if (activeTask) {
      activeTask(run)
    }
    else if (!err) {
      if (client) client.reload(null, Array.from(files))
      man.emit('ready')
      files.clear()
    }
  }

  opt.jobs.forEach(job => {
    if (job.cmd) {
      let fn = createExecutor(job.cmd)
      jobsByPriority.push(fn)
      if (job.pattern) {
        createExecWatcher(fn, job.pattern)
      }
      else {
        bundleJobs.push(fn)
      }
    }
    else {
      // use concat instead of push to make sure we get a flat array
      extraPatterns = extraPatterns.concat(job.pattern)
    }
  })
  let bundle = createBundler(browserify, opt.outfile)
  bundleJobs.push(bundle)
  jobsByPriority.push(bundle)

  createWatchify(browserify, opt.serveDirectory, extraPatterns)
  .on('error', onError)
  .on('change', file => {
    files.add(pathlib.relative(CWD, file))
    bundleJobs.forEach(job => queuedJobs.add(job))
    cycle()
  })

  function createExecWatcher(job, pattern) {
    return chokidar.watch(pattern, {
      ignoreInitial: true,
      atomic: false // Handle debouncing manually
    })
    .on('error', onError)
    .on('change', file => {
      files.add(file)
      queuedJobs.add(job)
      cycle()
    })
  }

  // Initial build cycle
  jobsByPriority.forEach(job => queuedJobs.add(job))
  cycle()

  if (client) man.middleware = client.middleware
  return man
}

function getNextJob(jobsByPriority, queuedJobs) {
  let job = null
  for (let index = 0; index < jobsByPriority.length; index++) {
    job = jobsByPriority[index]
    if (queuedJobs.has(job)) {
      queuedJobs.delete(job)
      return job
    }
  }
  return null
}

/**
 * Wrap browserify.bundle()
 * @param {object} browserify
 * @param {string} file Bundle output
 * @return {func} bundle(callback)
 */
function createBundler(browserify, file) {
  return (callback) => {
    // Coalesce the error/finish events from the bundle output stream
    // into a single "exit" event that can be easily discarded/updated
    let ts = Date.now()
    let next = err => {
      if (err) return callback(err)
      outputBuildStatus(`created ${file} over`, ts)
      callback()
    }
    browserify.bundle()
    .on('error', next)
    .once('readable', function () {
      this.pipe(fs.createWriteStream(file))
      .on('error', next)
      .on('finish', next)
    })
  }
}

/**
 * Wrap a shell command
 * @param {string} command
 * @param {func} exec(callback)
 */
function createExecutor(command) {
  return (callback) => {
    const ts = Date.now()
    const proc = childProcess.exec(command).on('exit', (err) => {
      if (err) {
        err = new Error(`--exec "${command}" returned non-zero exit status: ${err}`)
        err.quiet = true
        return callback(err)
      }
      outputBuildStatus(`completed ${command} in`, ts)
      callback()
    })
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
  }
}

function outputBuildStatus(operation, ts) {
  let elapsed = ((Date.now() - ts) / 1000).toFixed(2)
  let createdAt = new Date().toTimeString().substr(0, 8)
  process.stdout.write(`${createdAt} >> ${operation} ${elapsed}s\n`)
}

function debounce(action, wait) {
  let timer = null
  return () => {
    clearTimeout(timer)
    setTimeout(action, wait)
  }
}

module.exports = createBuildManager
