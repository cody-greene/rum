#!/usr/bin/env node
'use strict'
const getWatchJobs = require('./get-watch-jobs')
const argv = require('minimist')(process.argv.slice(2), {
  string: [
    'exec',
    'port',
    'watch',
    'router',
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
    router: 'r'
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

if (argv.port && argv.port.includes(':')) {
  let [addr, port] = argv.port.split(':')
  argv.addr = addr || null
  argv.port = port || null
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

require('./server')(argv)
