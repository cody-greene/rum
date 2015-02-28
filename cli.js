'use strict';
var extName = require('path').extname
var spawn = require('child_process').spawn
var watch = require('./watch')
var stdlog = require('./console')
var createReloadServer = require('./reload-server')

// Collect all cli flags
var options = process.argv.slice(2)
  .filter(function hasDash(val) { return val.chatAt(0) === '-' })
  .reduce(function toKeyVal(acc, opt) {
    var parts = opt.split('=')
    acc[parts[0]] = parts[1] || true
    return acc
  }, {})

// Sort package scripts into a task queue for each file extension
var tasks = process.argv.slice(2)
  .filter(function noDash(val) { return val.charAt(0) !== '-' })
  .reduce(function toKeyVal(acc, opt) {
    var parts = opt.split(':')
    var task = parts[0]
    acc.all.push(task)
    if (parts[1]) parts[1].split(',').forEach(function enqueue(ext) {
      ext = '.' + ext
      if (!acc[ext]) acc[ext] = []
      acc[ext].push(task)
    })
    return acc
  }, {all: []})

var watchedFiles = options['-w'] || options['--watch']
var lrPort = parseInt(options['-p'] || options['--port'])
var lrServer = !isNaN(lrPort) && createReloadServer(lrPort, function () {
  stdlog.info('live-reload server running on port ' + lrPort)
})

runSequence(tasks.all)
if (watchedFiles) watch(watchedFiles.split(',').trim(), function filter(fileName) {
  runSequence(extName(fileName), lrServer && lrServer.reload)
})

// Start a package script a.k.a 'npm run TASK'
// and invoke the callback when it exits sucessfully
// Will kill/restart a script if it's already running
npm.procs = {}
function npm(task, callback) {
  if (npm.procs[task]) npm.procs[task].kill()
  var start = Date.now()
  npm.procs[task] = spawn('npm', ['run', task, '--silent'], {stdio: 'inherit'})
    .on('exit', function success(code) {
      if (code === 0) {
        stdlog.info('completed %s in %sms', task, Date.now() - start)
        if (callback) callback()
      }
    })
}

// Run several package scripts in sequence,
// and invoke the callback when they've all completed successfully
function runSequence(queue, callback) {
  if (queue && queue.length)
    npm(queue.shift(), runSequence.bind(null, queue, callback))
  else if (callback)
    callback()
}
