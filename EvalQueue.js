const FastPriorityQueue = require('fastpriorityqueue')

class EvalQueue {
  constructor(init = []) {
    this._visited = new Set()
    this._queue = new FastPriorityQueue((a, b) => a.order > b.order)

    for (const entry of init) {
      this.add(entry)
    }
  }

  add(entry) {
    if (this._visited.has(entry.name)) {
      return
    }

    this._visited.add(entry.name)
    this._queue.add(entry)
  }

  poll() {
    return this._queue.poll()
  }

  size() {
    return this._queue.size
  }
}

module.exports = EvalQueue
