#!/usr/bin/env node
'use strict'
const argv = require('minimist')(process.argv.slice(2), {
  string: [
    'exec',
    'port',
    'watch',
  ],
  boolean: [
    'help',
    'version',
  ],
  alias: {
    exec: 'x',
    help: 'h',
    port: 'p',
    version: 'v',
    watch: 'w',
  },
  '--': true
})

if (argv.version) {
  process.stdout.write('v' + require('../package.json').version + '\n')
  return
}

if (argv.help || argv._.length === 0) {
  require('fs').createReadStream(__dirname + '/help.txt', 'utf8').pipe(process.stdout)
  return
}

if (argv._.length === 1) {
  argv.outfile = argv._[0]
}
else if (argv._.length === 2) {
  argv.serveDirectory = argv._[0]
  argv.outfile = argv._[1]
}
argv.browserifyParams = argv['--']
argv.jobs = getWatchJobs(process.argv.slice(2))

require('./index')(argv)

function getWatchJobs(argv) {
  let jobs = [] // priority queue where browserify is always lowest: {pattern, cmd} => {priority, fn}
  var arg, value, prev
  for (let index = 0; index < argv.length; index++) {
    arg = argv[index]
    value = argv[index + 1]
    if (arg === '--') {
      break
    }
    if (/^(--watch|-w)$/.test(arg)) {
      if (!value || value.indexOf('-') === 0) {
        throw new Error('no path provided for "--watch"')
      }
      index += 1
      if (!prev) {
        jobs.push(prev = {pattern: [value], cmd: null})
      }
      else if (prev.pattern) {
        prev.pattern.push(value)
      }
      else {
        prev.pattern = [value]
      }
    }
    else if (/^(--exec|-x)$/.test(arg)) {
      if (!value || value.indexOf('-') === 0) {
        throw new Error('no command provided for "--exec"')
      }
      index += 1
      if (!prev || prev.cmd) {
        jobs.push({pattern: null, cmd: value})
      }
      else {
        prev.cmd = value
      }
      prev = null
    }
  }
  return jobs
}
