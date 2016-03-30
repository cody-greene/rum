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

argv.serveDirectory = argv._[0] || '.'
argv.outfile = argv._[1]
argv.browserifyParams = argv['--']

if (!argv.outfile) throw new TypeError('<outfile> must be provided; see --help')

if (argv.version) process.stdout.write('v' + require('../package.json').version + '\n')
else if (argv.help) require('fs').createReadStream(__dirname + '/help.txt', 'utf8').pipe(process.stdout)
else require('./index')(argv)
