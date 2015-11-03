#### rum
Combines a static webserver with a file watcher to automatically rebuild and refresh your web app. Works best with another task runner like `make`.

```
rum <src> <dist> <cmd> [-- <params>]
  Serves files from <dist> directory over http. Invokes <cmd> with <params> when
  files in <src> directory change and then emits a "reload" event.
  Include lib/client.js to capture the reload event.

Options:
  --port, -p     Bind server to this port instead of a random one.      [string]
  --icon, -i     Use a custom favicon
                    [string] [default: "rum/lib/favicon.ico"]
  --help, -h     Show help                                             [boolean]
  --version, -v  Show version number                                   [boolean]

Examples:
  rum -p 8080 app/ build/ make
  rum lib/ . date -- +%H:%M:%S
```
