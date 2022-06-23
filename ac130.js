const EvalQueue = require('./EvalQueue')

function traverse(graph, names) {
  const running = new Set()
  const visited = new Set()
  let order = 0

  const inner = (name) => {
    if (visited.has(name)) {
      if (running.has(name)) {
        const stack = Array.from(running).concat(name)

        throw new Error(`Cycle detected: ${stack.join(' -> ')}`)
      }

      return
    }

    visited.add(name)
    running.add(name)

    const node = graph[name]

    for (const nextName of node.next) {
      inner(nextName)
    }

    running.delete(name)
    node.order = order++
  }

  for (const name of names) {
    inner(name)
  }
}

function construct(name) {
  return {
    name,
    deps: [],
    next: [],
    order: 0,
  }
}

function prepare(defs) {
  const graph = Object.create(null)
  const values = Object.create(null)

  for (const [name, def] of Object.entries(defs)) {
    let node = graph[name]

    if (!node) {
      node = construct(name)
      graph[name] = node
    }

    if (def.eq) {
      node.eq = def.eq
    }

    if (def.fn) {
      node.fn = def.fn
      node.deps = def.deps

      for (const dep of node.deps) {
        let depNode = graph[dep]

        if (!depNode) {
          depNode = construct(dep)
          graph[dep] = depNode
        }

        depNode.next.push(name)
      }
    } else {
      values[name] = def.value
    }
  }

  traverse(graph, Object.keys(values))

  return { graph, values }
}

function ac130(defs) {
  const { graph, values } = prepare(defs)
  let init = true

  const setValues = (changes) => {
    const changesNames = Object.keys(changes)

    for (const name of changesNames) {
      if (graph[name].fn) {
        throw new Error(`Write to computed property: ${name}`)
      }
    }

    const changed = Object.create({
      ...changes,
      __proto__: values,
    })
    const evalQueue = new EvalQueue(
      changesNames.map((name) => graph[name])
    )

    while (evalQueue.size()) {
      const node = evalQueue.poll()
      const value = node.fn
        ? node.fn(...node.deps.map((dep) => changed[dep]))
        : changed[node.name]
      const isEqual = !init && (node.eq
        ? node.eq(value, values[node.name])
        : value === values[node.name]
      )

      if (!isEqual) {
        changed[node.name] = value

        for (const nextName of node.next) {
          evalQueue.add(graph[nextName])
        }
      }
    }

    Object.assign(values, changed)

    return changed
  }

  const getValues = () => values

  setValues(values)
  init = false

  return { getValues, setValues }
}

module.exports = ac130
