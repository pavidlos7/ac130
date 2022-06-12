function ac130(defs) {
  const graph = Object.create(null)
  const values = Object.create(null)
  let entries = Object.entries(defs)

  for (const [name, def] of entries) {
    graph[name] = {
      next: [],
    }

    if (def.fn) {
      Object.assign(graph[name], def)
    } else {
      values[name] = def.value
    }
  }

  for (const [name, def] of entries) {
    (graph[name].deps || []).forEach((dep) => {
      graph[dep].next.push(name)
    })
  }

  entries = null

  const traverse = (changesNames) => {
    const running = new Set()
    const visited = new Set()
    const output = []

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

      const { next } = graph[name]

      for (const nextName of next) {
        inner(nextName)
      }

      running.delete(name)
      output.push(name)
    }

    for (const name of changesNames) {
      inner(name)
    }

    return output
  }

  const setValues = (changes) => {
    const changesNames = Object.keys(changes)

    for (const name of changesNames) {
      if (graph[name].fn) {
        throw new Error(`Write to computed property: ${name}`)
      }
    }

    const changed = { ...changes }
    const changedNames = traverse(changesNames).reverse()

    for (const name of changedNames) {
      const node = graph[name]
      const value = node.fn
        ? node.fn(
          ...node.deps.map(
            (dep) => changed.hasOwnProperty(dep)
              ? changed[dep]
              : values[dep]
          )
        )
        : changed[name]

      changed[name] = value
    }

    Object.assign(values, changed)

    return changed
  }

  const getValues = () => ({ ...values })

  setValues(values)

  return { getValues, setValues }
}

module.exports = ac130
