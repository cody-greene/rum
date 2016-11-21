#!/usr/bin/env node
'use strict'
const argv = require('minimist')(process.argv.slice(2), {
  string: [
    'exec',
    'icon',
    'port',
    'watch',
  ],
  boolean: [
    'help',
    'version',
  ],
  default: {
    icon: __dirname + '/favicon.ico'
  },
  alias: {
    exec: 'x',
    help: 'h',
    icon: 'i',
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

require('./index')(argv)
