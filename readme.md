```
rum [<static_dir>] <outfile> [-- <browserify>]
  Watchify plus static file server plus auto-reload.

Options:
  <static_dir>  Directory of static files to serve, images/fonts
                If omitted, the server is disabled

  <outfile>     Required. Where to dump the browserify bundle

  <browserify>  Arguments after the '--' will be passed along to browserify

  --exec, -x    Shell command to run on each update before browserify,
                and before reload. Will capture any preceeding
                --watch arguments, which are not already captured by
                another --exec. Can use this multiple times.

  --watch, -w   Additional glob pattern to monitor for changes.
                Can use this multiple times. Position is important.
                Will apply to the next --exec argument or to the
                browserify watcher if one is not found.

  --port, -p    Bind server to this port instead of a random one

  --version, -v Show version number

Basic usage:
  rum dist dist/bundle.js -- src/index.js
Watch scss:
  rum -w 'src/**/*.scss' -x 'make dist/bundle.css' dist dist/bundle.js -- src/index.js
More browserify options:
  rum dist dist/bundle.js -- src/index.js -t babelify -t [envify purge]
```

You can also listen for reload events in your browser bundle and do something special that depends on the file name. For example, you can hot reload stylesheets like this:
```javascript
// $ rum dist dist/index.js -w 'src/**/*.scss' -x 'make dist/bundle.css' -- src/hot-css.js src/app.js

// src/hot-css.js
require('rum').on('reload', function (files) {
  for (let index = 0; index < files.length; ++index) {
    if (!/\.(scss|sass|less|css)$/.test(files[index])) {
      return window.location.reload(true)
    }
  }

  // Only the css was changed. Time for hot reload!
  reloadCSS('index.css')
})

/**
 * Reload just the css bundle <link rel="stylesheet" href="...">
 * without refreshing the whole page
 */
function reloadCSS(href) {
  let links = document.getElementsByTagName('link')
  let index = links.length
  let cur = null
  while (cur = links[--index]) {
    if (cur.getAttribute('href') === href) {
      cur.href = ''
      cur.href = href
      console.warn('reloaded ' + href)
      return
    }
  }
}
```

#### Using VIM?
You may need to add `set backupcopy=yes` to your vimrc. The default method of saving files does not play nicely with filewatchers like chokidar.
