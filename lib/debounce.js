'use strict'

/**
 * @see lodash.debounce()
 * Safety checks removed.
 * @param {function} task
 * @param {number} wait In milliseconds
 */
module.exports = function debounce(task, wait) {
  let timer = null
  let args = null
  let context = null
  let timestamp = null

  function later() {
    var last = Date.now() - timestamp
    if (last < wait && last > 0) {
      timer = setTimeout(later, wait - last)
    }
    else {
      timer = null
      task.apply(context, args)
      if (!timer) context = args = null
    }
  }

  return function debounced() {
    context = this
    args = arguments
    timestamp = Date.now()
    if (!timer) timer = setTimeout(later, wait)
  }
}
