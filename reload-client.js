var SERVER_PORT = process.env.RELOAD_PORT || process.env.npm_package_config_reload_port || 9093
new window.EventSource('http://localhost:' + SERVER_PORT)
  .addEventListener('reload', location.reload.bind(location, true))
