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

if (argv._.length === 1) {
  argv.outfile = argv._[0]
}
else if (argv._.length === 2) {
  argv.serveDirectory = argv._[0]
  argv.outfile = argv._[1]
}
else throw new Error('too many arguments')

argv.browserifyParams = argv['--']

if (argv.version) process.stdout.write('v' + require('../package.json').version + '\n')
else if (argv.help) require('fs').createReadStream(__dirname + '/help.txt', 'utf8').pipe(process.stdout)
else if (!argv.outfile) throw new TypeError('<outfile> must be provided; see --help')
else require('./index')(argv)
