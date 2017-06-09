const assert = require('assert')
const getWatchJobs = require('../lib/get-watch-jobs')

function run(args) {
  let argv = args.split(' ')
  return getWatchJobs(argv)
}

describe('getWatchJobs()', function () {
  it('collects argv into a standard object', function () {
    assert.deepEqual(run('-w *.scss'), [
      {pattern: ['*.scss'], cmd: null}
    ])

    assert.deepEqual(run('-x foo'), [
      {pattern: null, cmd: 'foo'}
    ])

    assert.deepEqual(run('-w *.scss -x foo'), [
      {pattern: ['*.scss'], cmd: 'foo'}
    ])

    assert.deepEqual(run('-w *.scss -w *.sass -x foo'), [
      {pattern: ['*.scss', '*.sass'], cmd: 'foo'}
    ])

    assert.deepEqual(run('-w *.scss -w *.sass -x foo -w *.yml -x bar'), [
      {pattern: ['*.scss', '*.sass'], cmd: 'foo'},
      {pattern: ['*.yml'], cmd: 'bar'},
    ])
  })
})
