new window.EventSource('http://localhost:9093')
  .addEventListener('reload', location.reload.bind(location, true))
