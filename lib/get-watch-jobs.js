module.exports = function getWatchJobs(argv) {
  let jobs = [] // priority queue where browserify is always lowest: {pattern, cmd} => {priority, fn}
  var arg, value, prev
  for (let index = 0; index < argv.length; index++) {
    arg = argv[index]
    value = argv[index + 1]
    if (arg === '--') {
      break
    }
    if (/^(--watch|-w)$/.test(arg)) {
      if (!value || value.indexOf('-') === 0) {
        throw new Error('no path provided for "--watch"')
      }
      index += 1
      if (!prev) {
        jobs.push(prev = {pattern: [value], cmd: null})
      }
      else if (prev.pattern) {
        prev.pattern.push(value)
      }
      else {
        prev.pattern = [value]
      }
    }
    else if (/^(--exec|-x)$/.test(arg)) {
      if (!value || value.indexOf('-') === 0) {
        throw new Error('no command provided for "--exec"')
      }
      index += 1
      if (!prev || prev.cmd) {
        jobs.push({pattern: null, cmd: value})
      }
      else {
        prev.cmd = value
      }
      prev = null
    }
  }
  return jobs
}
