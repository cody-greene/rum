/* eslint-disable */
import type {BuildOptions} from 'esbuild'

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
  esbuildOptions: BuildOptions
}

declare function startServer(opt: EsthuluOptions): void
declare function createDevMiddleware(opt: EsthuluOptions): void

export default startServer
export {createDevMiddleware}
