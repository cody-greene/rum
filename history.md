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
