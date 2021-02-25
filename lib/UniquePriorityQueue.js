'use static'

module.exports = class UniquePriorityQueue {
  constructor() {
    this.items = new Set()
  }

  // {fn, priority}
  add(item) {
    this.items.add(item)
  }

  // return the item with lowest priority value
  get() {
    let best = null
    for (const cur of this.items) {
      if (best === null) {
        best = cur
      } else if (cur.priority < best.priority) {
        best = cur
      }
    }
    if (best !== null) {
      this.items.delete(best)
      return best
    }
  }

  delete(item) {
    this.items.delete(item)
  }

  clear() {
    this.items.clear()
  }
}
