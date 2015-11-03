'use strict';
/**
 * When included in a development build this module will listen for server-sent
 * events and refresh the page automatically.
 * Lets say your production bundle is made with:
 *   browserify app >dist/bundle.js
 * Your dev build can then be:
 *   browserify node_modules/rum/lib/client app >dist/bundle.js
 */
let src = new window.EventSource(location.origin + '/reload-stream')
console.warn('auto-refresh enabled')
src.errcount = 0
src.addEventListener('reload', function(){ location.reload(true) })
src.addEventListener('error', function () {
  if (++this.errcount > 5) {
    console.warn('closing auto-refresh connection')
    this.close()
  }
})
