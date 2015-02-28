### What is this, I don't even
```
rum <npm_script>[:ext1,ext2] <npm_script> ...
```
Run your package.json scripts by watching for changes to your source code. Provides an optional live-reload server and client-side snippet. This is an easy way to define automatic, incremental builds during development. Also useful as a shorthand when composing package scripts. There's no need for additional grunt/gulp plugins and configuration hell; use your tools directly! In fact, this utility is only dependant on node built-ins. It's very small! Just define `package.json` like so:
```
{
  "scripts": {
    "clean": "rm -rf dist && mkdir dist",
    "code-dev": "browserify -d node_modules/rum/reload-client ./src >dist/index.js",
    "code-prod": "browserify ./src | uglifyjs -cm | gzip >dist/index.js.gz",
    "style-dev": "lessc src/index.less >dist/index.css",
    "style-prod": "lessc src/index.less | cleancss --s0 | gzip >dist/index.css.gz"

    // Watch for changes and start a reload-server
    "test": "rum clean --watch=./src code-dev:js,jsx style-dev:less --port=9093",

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
Add an entry to the [scripts field](https://docs.npmjs.com/misc/scripts) of `package.json`. Want to run that script whenever you make changes to a `.js` file in the `src/` directory? Try `rum task_name:js --watch=src`. Additional comma-separated file extensions are encouraged! When a task is not assigned to any file extensions it will only be run once during initialization. In fact, all tasks will be run at least once, and in the order they are given. 

### Options
`-p, --port=<port_number>` Create a live-reload server on the given port

`-w, --watch=<dir1,dir2>` Monitor changes in the given directories (recursive)
