### What is this, I don't even
```
rum <npm_script>[:ext1,ext2] [--watch <dir>] [--port <num>]
rum [--watch <dir>] [ --node <module1,module2>[:ext] ]

File extensions:
  Associate a task with one or more (comma separated) file extensions
  and it will run whenever a matching file is updated.

Options:
  --node, -n   Spawn multiple long-running node processes which may be restarted
  --spawn, -s  Spawn a long-running task outside of the init queue
  --watch, -w  Monitor changes in the given directory (recursive)
  --port, -p   Create a live-reload server on the given port
```
Run your package.json scripts by watching for changes to your source code. Provides an optional live-reload server and client-side snippet. This is an easy way to define automatic, incremental builds during development. Also useful as a shorthand when composing package scripts. There's no need for additional grunt/gulp plugins and configuration hell; use your tools directly! Just define `package.json` like so:
```
{
  "config": {
    "reload_port: 9093
  },
  "scripts": {
    "clean": "rm -rf dist && mkdir dist",
    "code-dev": "browserify -d node_modules/rum/reload-client ./src >dist/index.js",
    "code-prod": "browserify ./src | uglifyjs -cm | gzip >dist/index.js.gz",
    "style-dev": "lessc src/index.less >dist/index.css",
    "style-prod": "lessc src/index.less | cleancss --s0 | gzip >dist/index.css.gz"

    // Watch for changes and start a reload-server
    "test": "rum clean --watch ./src code-dev:js,jsx style-dev:less --port $npm_package_config_reload_port",

    // Just run a few scripts in sequence, then exit
    "start": "rum clean code-prod style-prod"
  },
  "devDependencies": {
    "browserify": "latest",
    "uglify-js": "latest",
    "less": "latest",
    "clean-css": "latest"
    "rum": "latest"
  }
}
```

### Writing tasks
Add an entry to the [scripts field](https://docs.npmjs.com/misc/scripts) of `package.json`. Want to run that script whenever you make changes to a `.js` file in the `src/` directory? Try `rum task_name:js --watch src`. When a task is not assigned to any file extensions it will only be run once during initialization. In fact, all tasks will be run at least once, and in the order they are given. A long-running process, like a file server, should be last or end up blocking everything else in the queue.

### The `--node` option
If your project involves multiple long running processes, like an express app with some background workers, then you can use this instead of [nodemon](https://github.com/remy/nodemon), which only handles one process at a time.
```
rum --watch src --node src/server,src/worker:js
```
The web server and the worker will start in parallel (as a child process via `node SCRIPT`), and will be restarted whenever a change is made to `src/**/*.js`. When restarting, each process will recieve the `SIGTERM` signal, which can be caught and handled appropriately by each child process.
```javascript
process.on('SIGTERM', shutdown).on('SIGINT', shutdown)
function shutdown() {
  server.close(process.exit)
  // The "Connection: Keep-Alive" header can prevent the server from closing immediately
  // For fast restarts, set "Connection: Close" in development
  setTimeout(process.exit, 10000)
}
```
