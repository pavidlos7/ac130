const { performance } = require('perf_hooks')
const ac130 = require('./ac130.js')

function generateLayers(m, n, fn) {
  return Object.fromEntries(
    Array
      .from(
        { length: 3 },
        (_, idx) => {
          const part = `part-${idx}`

          return {
            part,
            source: `${part}_source`,
            layers: Array.from(
              { length: m },
              (_, i) => Array.from(
                { length: n },
                (_, j) => `${part}_node-${i}-${j}`
              )
            )
          }
        }
      )
      .map(({ part, source, layers }, idx, parts) => [
        [source, {
          value: 1,
        }],
        [part, {
          fn,
          deps: [
            source,
            ...idx ? parts[idx - 1].layers[layers.length - 1] : [],
          ]
        }],
        ...layers
          .map(
            (nodes, idx) => nodes.map((node) => [node, {
              fn,
              deps: idx ? layers[idx - 1] : [part],
            }])
          )
          .flat(1),
      ])
      .flat(1)
  )
}

function perf() {
  const m = 1000
  const n = 100
  
  console.log(`${m * n * 3} nodes`)

  const defs = generateLayers(m, n, (...args) =>
    args.reduce((sum, item) => sum + item / args.length, 0)
  )
  let ac
  let isEqual = false

  defs['part-2'].eq = () => isEqual

  ;[
    [
      'init',
      () => {
        ac = ac130(defs)
      },
    ],
    [
      'full recalculation',
      () => {
        ac.setValues({ 'part-0_source': 2 })
      },
    ],
    [
      'partial recalculation 1',
      () => {
        ac.setValues({ 'part-1_source': 2 })
      },
    ],
    [
      'partial recalculation 2',
      () => {
        isEqual = true
        ac.setValues({ 'part-1_source': 3 })
      },
    ]
  ].forEach(([step, action]) => {
    const start = performance.now()
    action()
    const end = performance.now()

    console.log(`${step}:${' '.repeat(40 - step.length)}${(end - start).toFixed(13)} ms`)
  })
}

perf()
