'use strict'
const EventEmitter = require('events')
const childProcess = require('child_process')
const chokidar = require('chokidar')
const esbuild = require('esbuild')
const mm = require('minimatch')
const pathlib = require('path')
const createClientStream = require('./client-stream')
const UniquePriorityQueue = require('./UniquePriorityQueue')
const BUILD_DEBOUNCE_MS = 100
const CWD = process.cwd()

const initPlugin = (options = {}) => ({
  // This plugin will add all loaded files to the chokidar watch list
  name: 'esbuild-plugin-esthulu',
  setup(build) {
    const {
      excludeGlob = '**/node_modules/**',
      watcher // Chokidar.Watcher
    } = options
    const shouldExclude = mm.filter(excludeGlob)
    build.onLoad({filter: /.*/}, ({path}) => {
      if (!shouldExclude(path)) {
        watcher.add(path)
      }
    })
  }
})

/**
 * During development this module will watch our source files for updates,
 * rebuild the project, and politely ask the browser to refresh
 * @return {EventEmitter}
 * @event ready A build cyle has completed
 */
function createBuildManager(opt) {
  const man = new EventEmitter()
  const bundleJobs = []
  const queue = new UniquePriorityQueue()
  let extraPatterns = []

  // If the server is disabled, then we don't need an event stream
  const client = createClientStream()

  // List of (unique) files updated since the last reload signal was sent
  const files = new Set()

  // Currently active build step
  let activeJob = null

  /**
   * - err.quiet: Hide the stack trace
   * - err.silent: Don't print anything to the terminal
   */
  const onError = (err) => {
    if (!err.silent) {
      // eslint-disable-next-line no-console
      console.error(err.quiet ? err.toString() : err.stack)
    }
    if (client) client.reload(err)
  }

  /**
   * Execute recursively until there's no more tasks to run.
   * Check after each task exits to avoid timing issues
   */
  const run = (err) => {
    if (err) {
      onError(err)
      if (bundleJobs.includes(activeJob)) {
        bundleJobs.forEach((job) => queue.delete(job))
      }
    }
    activeJob = queue.get()
    if (activeJob != null) {
      activeJob.fn().then(run, run)
    } else if (!err) {
      if (client) {
        client.reload(null, Array.from(files))
      }
      man.emit('ready')
      files.clear()
    }
  }

  // Begin or extend a build cycle
  const cycle = debounce(() => {
    if (!activeJob) run()
  }, BUILD_DEBOUNCE_MS)

  const createExecWatcher = (job, pattern) => {
    return chokidar.watch(pattern, {
      ignoreInitial: true,
      atomic: false // Handle debouncing manually
    })
      .on('error', onError)
      .on('change', file => {
        files.add(file)
        queue.add(job)
        cycle()
      })
  }

  opt.jobs.forEach(({cmd, pattern}, idx) => {
    if (cmd) {
      const job = {
        fn: createExecutor(cmd),
        priority: idx
      }
      if (pattern) {
        createExecWatcher(job, pattern)
      } else {
        bundleJobs.push(job)
      }
      queue.add(job)
    } else {
      // use concat instead of push to make sure we get a flat array
      extraPatterns = extraPatterns.concat(pattern)
    }
  })

  // chokidar@1.4.3:
  // - if both src/index.js and /home/user/rum/src/index.js are added
  // - then two "update" events will fire on the same file
  const absoluteEntries = opt.esbuildOptions.entryPoints.map(
    (file) => pathlib.resolve(process.cwd(), file)
  )
  const watcher = chokidar.watch(absoluteEntries.concat(extraPatterns), {
    atomic: false, // Debounce manually
    ignoreInitial: true,
    ignored: ['**/node_modules/**']
  })
    .on('error', onError)
    .on('change', (file) => {
      files.add(pathlib.relative(CWD, file))
      bundleJobs.forEach((job) => queue.add(job))
      cycle()
    })

  const primaryJob = {
    fn: createESBuilder(opt.esbuildOptions, initPlugin({watcher})),
    priority: opt.jobs.length
  }
  bundleJobs.push(primaryJob)
  queue.add(primaryJob)

  cycle() // Initial build!

  if (client) man.middleware = client.middleware
  return man
}

function createESBuilder(esbuildOptions, plugin) {
  let esb = null
  return async () => {
    const ts = Date.now()
    try {
      if (esb === null) {
        esb = await esbuild.build({
          ...esbuildOptions,
          incremental: true,
          plugins: [plugin, ...(esbuildOptions.plugins ?? [])],
        })
      } else {
        await esb.rebuild()
      }
    } catch (err) {
      // esbuild prints its own errors
      if (err.errors != null) {
        // esbuild will probably log this
        err.silent = true
      }
      throw err
    }
    outputBuildStatus('esbuild completed over', ts)
    // result.outputFiles[].path
    // esb.rebuild.dispose()
  }
}

function createExecutor(command) {
  return () => new Promise((resolve, reject) => {
    const ts = Date.now()
    const proc = childProcess.exec(command).on('exit', (err) => {
      if (err) {
        err = new Error(`--exec "${command}" returned non-zero exit status: ${err}`)
        err.quiet = true
        reject(err)
      } else {
        outputBuildStatus(`completed ${command} in`, ts)
        resolve()
      }
    })
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
  })
}

function outputBuildStatus(operation, ts) {
  let elapsed = ((Date.now() - ts) / 1000).toFixed(2)
  let createdAt = new Date().toTimeString().substr(0, 8)
  process.stdout.write(`[esthulu] ${createdAt} >> ${operation} ${elapsed}s\n`)
}

function debounce(action, wait) {
  let timer = null
  return () => {
    clearTimeout(timer)
    timer = setTimeout(action, wait)
  }
}

module.exports = createBuildManager
