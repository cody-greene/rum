#!/usr/bin/env node
'use strict';
var extName = require('path').extname
var spawn = require('child_process').spawn
var watch = require('./watch')
var stdlog = require('./console')
var createReloadServer = require('./reload-server')
var argv = require('yargs')
  .usage('rum <npm_script> <npm_script>[:ext1,ext2]', {
    'spawn': {
      alias: 's',
      type: 'array',
      describe: 'Spawn a long-running task outside of the init queue'
    },
    'watch': {
      alias: 'w',
      type: 'array',
      describe: 'Monitor changes in the given comma-separated directories (recursive)'
    },
    port: {
      alias: 'p',
      type: 'number',
      describe: 'Create a live-reload server on the given port'
    }
  })
  .strict()
  .argv

// Sort package scripts into a task queue for each file extension
var tasks = argv._.reduce(function toKeyVal(acc, opt) {
  var parts = opt.split(':')
  var task = parts[0]
  acc.all.push(task)
  if (parts[1]) parts[1].split(',').forEach(function enqueue(ext) {
    ext = '.' + ext.trim()
    if (!acc[ext]) acc[ext] = []
    acc[ext].push(task)
  })
  return acc
}, {all: []})

var lrServer = !isNaN(argv.port) && createReloadServer(argv.port, function () {
  stdlog.info('live-reload server running on port ' + argv.port)
})

// Start a package script a.k.a 'npm run TASK'
// and invoke the callback when it exits sucessfully
// Will kill/restart a script if it's already running
var procs = {}
function npm(task, callback) {
  if (procs[task]) procs[task].kill()
  var start = Date.now()
  procs[task] = spawn('npm', ['run', task, '--silent'], {stdio: 'inherit'})
    .on('exit', function success(code) {
      procs[task] = null
      if (code === 0) {
        stdlog.info('completed %s in %sms', task, Date.now() - start)
        if (callback) callback()
      }
    })
}

// Run several package scripts in sequence,
// and invoke the callback when they've all completed successfully
function runSequence(queue, callback) {
  if (queue.length)
    npm(queue[0], runSequence.bind(null, queue.slice(1), callback))
  else if (callback)
    callback()
}

if (argv.spawn) argv.spawn.forEach(function (task) {npm(task)})
runSequence(tasks.all)
if (argv.watch) watch(argv.watch, function filter(fileName) {
  var queue = tasks[extName(fileName)]
  if (queue) {
    stdlog.debug('watcher:', fileName)
    runSequence(queue, lrServer && lrServer.reload)
  }
})
