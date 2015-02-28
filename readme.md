### Usage
```
rum <npm_script>[:ext1,ext2] <npm_script> ...
```
Run your package.json scripts by watching for changes to your source code. Provides an optional live-reload server and client-side snippet. This is an easy way to define automatic, incremental builds during development. Also useful as a shorthand when composing package scripts. There's no need for additional grunt/gulp plugins and configuration hell; use your tools directly! In fact, this utility is only dependant on node built-ins. It's very small! Just define `package.json` like so:
```
{
  "scripts": {
    "clean": "rm -rf dist && mkdir dist",
    "js-dev": "browserify -d node_modules/rum/reload-client ./src >dist/index.js",
    "js-prod": "browserify ./src | uglifyjs -cm | gzip >dist/index.js.gz",
    "css-dev": "lessc src/index.less >dist/index.css",
    "css-prod": "lessc src/index.less | cleancss --s0 | gzip >dist/index.css.gz"

    // Watch for changes and start a reload-server
    "test": "rum clean --watch=./src js-dev:js,jsx css-dev:less --port=9093",

    // Just run a few scripts in sequence, then exit
    "start": "rum clean js-prod css-prod"
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

### Options
`-p, --port=<port_number>` Create a live-reload server on the given port

`-w, --watch=<dir1,dir2>` Monitor changes in the given directories (recursive)
