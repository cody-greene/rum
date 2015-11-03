#!/usr/bin/env node
'use strict';
let argv = require('yargs')
.usage(`rum <src> <dist> <cmd> [-- <params>]
  Serves files from <dist> directory over http. Invokes <cmd> with <params> when
  files in <src> directory change and then emits a "reload" event.
  Include lib/client.js to capture the reload event.`,
{
  port: {
    alias: 'p',
    type: 'string',
    describe: 'Bind server to this port instead of a random one.'
  },
  icon: {
    alias: 'i',
    type: 'string',
    default: __dirname + '/favicon.ico',
    describe: 'Use a custom favicon'
  }
})
.demand(3)
.help('help').alias('help', 'h')
.version(function(){ return require('../package.json').version }).alias('version', 'v')
.example('rum -p 8080 app/ build/ make')
.example('rum lib/ . date -- +%H:%M:%S')
.argv
let params = argv._
require('./index')({
  favicon: argv.icon,
  port: argv.port,
  src: params.shift(),
  dist: params.shift(),
  cmd: params.shift(),
  params: params
})
