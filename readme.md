Watchify plus static file server plus auto-reload.

esbuild wrapper with:
- chokidar for efficient file watching, where esbuild only uses polling
- http server
- page refresh when files change
- css hot-reload

```
const rumServerStart = require('rum')

rumServerStart({
  serverRoot: './build',
  jobs: [
    {cmd: './make-css.sh', pattern: 'src/**/*.scss'}
  ],
  esbuildOptions: {
    entryPoints: ['src/app.js'],
    outfile: './build/bundle.js',
    bundle: true,
  }
})

type Options = {
  // Alternative way to set the http server port
  // default: random
  port?: string,

  // Bind server to this address:port
  // default: '0.0.0.0:<random>'
  addr?: string,

  // Redirect all requests to this path but keep the displayed url unchanged.
  // Use this if you've got client-side routing and want to avoid 404s
  // when refreshing.
  // default: undefined
  router?: string,

  // Root directory of http server. If undefined, the server is disabled.
  // default: undefined
  serverRoot?: string,

  // Shell commands to run on each update, before esbuild.
  // - commands with a pattern will only execute when a file matching the pattern has changed
  // - commands without a pattern will execute when esbuild is about to run
  // - patterns without a command will apply to the esbuild watcher
  // default: undefined
  jobs?: Array<{cmd?: string, pattern?: string}>,

  // passed through to esbuild.build()
  esbuildOptions: any
}
```

You can also listen for reload events in your browser bundle and do something special that depends on the file name. For example, you can hot reload stylesheets by including this in your bundle:
```javascript
// src/hot-css.js
import rum from 'rum'
rum.addEventListener('reload', (evt) => {
  // list of absolute paths that have changed
  const files = evt.detail

  for (let index = 0; index < files.length; ++index) {
    if (!/\.(scss|sass|less|css)$/.test(files[index])) {
      return
    }
  }

  // don't refresh the whole page
  evt.preventDefault()

  // Only the css was changed. Time for hot reload!
  reloadCSS('/index.css')
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
