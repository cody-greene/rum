Watchify plus static file server plus auto-reload.

esbuild wrapper with:
- chokidar for efficient file watching, where esbuild only uses polling
- http server
- page refresh when files change
- css hot-reload

```
const startServer = require('@cody-greene/esthulu')

startServer({
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

interface EsthuluOptions {
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
// src/css-reload.js
import esthulu from '@cody-greene/esthulu/client'

esthulu.addEventListener('reload', (evt) => {
  // list of absolute paths that have changed
  const files = evt.detail

  for (let index = 0; index < files.length; ++index) {
    if (!/\.(scss|css)$/.test(files[index])) {
      return
    }
  }

  // Only the css was changed. Time for hot reload!
  const link = document.getElementById('app-css')
  if (link instanceof HTMLLinkElement) {
    let u = new URL(link.href)
    u.searchParams.set('ts', '' + Date.now())
    link.href = u.toString()
    // don't refresh the whole page
    evt.preventDefault()
  }
  console.warn('css hot-reload failed; element not found')
})
```

#### Using VIM?
You may need to add `set backupcopy=yes` to your vimrc. The default method of saving files does not play nicely with filewatchers like chokidar.
