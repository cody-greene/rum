# 2020-06-01 v6.0.0
- use the Unlicense license
- upgrade to chokidar 3.x

# 2018-11-12 v5.1.0
- can bind to a specific network interface with `--port [addr:]port`

# 2018-05-03 v5.0.0
- browserify `^16.2.0`
- chokidar `^2.0.2`
- Breaking: Upgrade globbing dependencies which require globs to be more strict and always use POSIX-style slashes because Windows-style slashes are used as escape sequences

# 2017-11-02 v4.1.1
- client module exports `connect()` and `disconnect()`

# 2017-08-16 v4.0.2
- don't crash the client on IE

# 2017-06-09 v4.0.0
- add the `--router <filepath>` option which redirects all requests to *filepath*. Use this if you've got client-side routing and want to avoid 404s

Upgrade dependencies:
- browserify@14.x (drops IE10 support)
- connect-gzip-static@2.x (adds brotli support)
- add a test or two

# 2017-02-23 v3.0.0
- you can now supply multiple `--exec` options with their own watch patterns
- removed the `--icon` option

# 2017-01-31 v2.2.1
- build completion messages now contain a timestamp

# v2.2.0
- fix `--help` text
- clear queued `--exec` tasks on build errors
- omit the useless stack trace from failed `--exec` tasks

# v2.1.0
`<static_dir>` is now optional, disabling the server if omitted.

# v2.0.1
Instead of adding the reloader client as an entry file, `require("rum")` is prepended to an existing entry file. This means top-level browserify transforms should no longer be applied to `node_modules`, speeding up the initial build, and avoiding any bugs related to transforms running on unexpected files.
