#!/usr/bin/env node
'use strict';
var extName = require('path').extname
var spawn = require('child_process').spawn
var watch = require('node-watch')
var stdlog = require('./console')
var createReloadServer = require('./reload-server')
var arrayPush = Array.prototype.push
var argv = require('yargs')
  .usage('rum <npm_script> <npm_script>[:ext1,ext2]', {
    node: {
      alias: 'n',
      type: 'array',
      describe: 'Spawn multiple node processes which may be restarted'
    },
    spawn: {
      alias: 's',
      type: 'array',
      describe: 'Spawn a long-running task outside of the init queue'
    },
    watch: {
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

var nodes = (argv.node || []).reduce(function (acc, opt) {
  var parts = opt.split(':')
  var modules = parts[0].split(',')
  var extensions = parts[1]
  arrayPush.apply(acc.all, modules)
  if (extensions) extensions.split(',').forEach(function (ext) {
    ext = '.' + ext.trim()
    if (!acc[ext]) acc[ext] = []
    arrayPush.apply(acc[ext], modules)
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

function spawnNode(moduleName) {
  procs[moduleName] = spawn('node', [moduleName], {stdio: 'inherit'})
    .on('exit', function () {procs[moduleName] = null})
}

function respawnNode(moduleName) {
  if (procs[moduleName]) procs[moduleName]
    .removeAllListeners('exit') // remove previous listener with rapid respawn attempts
    .on('exit', spawnNode.bind(null, moduleName))
    .kill()
  else spawnNode(moduleName)
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
nodes.all.forEach(spawnNode)
if (argv.watch) watch(argv.watch, function filter(fileName) {
  var ext = extName(fileName)
  var queue = tasks[ext]
  var list = nodes[ext]
  if (list || queue) stdlog.info('watcher:', fileName)
  if (list) list.forEach(respawnNode)
  if (queue) runSequence(queue, lrServer && lrServer.reload)
})
