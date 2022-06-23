const ac130 = require('./ac130')

describe('ac130 test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should init properly 1', () => {
    const defs = {
      a: {
        value: 10,
      },
      b: {
        deps: ['a'],
        fn: (a) => a + 1,
      },
      c: {
        deps: ['a'],
        fn: (a) => a - 1,
      },
      d: {
        deps: ['b', 'c'],
        fn: (b, c) => b * c,
      },
    }
    const ac = ac130(defs)

    expect(ac.getValues()).toEqual({
      a: 10,
      b: 11,
      c: 9,
      d: 99,
    })
  })

  it('should init properly 2', () => {
    const defs = {
      a: {
        value: 10,
      },
      b: {
        deps: ['a'],
        fn: jest.fn((a) => a + 1),
      },
      c: {
        deps: ['a'],
        fn: jest.fn((a) => a - 1),
      },
      k: {
        deps: ['c'],
        fn: (c) => c,
      },
      d: {
        deps: ['b'],
        fn: jest.fn((b) => b * 2),
      },
      e: {
        deps: ['b', 'c', 'z'],
        fn: jest.fn((b, c, z) => b * c - z),
      },
      f: {
        deps: ['c', 'e'],
        fn: jest.fn((c, e) => c + e),
      },
      g: {
        deps: ['d', 'f', 'z'],
        fn: jest.fn((d, f, z) => d - f * z),
      },
      z: {
        value: 11,
      },
    }
    const ac = ac130(defs)

    expect(ac.getValues()).toEqual({
      a: 10,
      b: 11,
      c: 9,
      d: 22,
      e: 88,
      f: 97,
      g: -1045,
      z: 11,
      k: 9,
    })
    ;['b', 'c', 'd', 'e', 'f', 'g'].forEach((name) => {
      expect(defs[name].fn).toHaveBeenCalledTimes(1)
    })
  })

  it('should init properly 3', () => {
    const defs = {
      a: {
        value: 2,
      },
      b: {
        deps: ['a'],
        fn: (a) => a + 2,
      },
      c: {
        deps: ['a', 'b'],
        fn: (a, b) => a * b,
      },
    }
    const ac = ac130(defs)

    expect(ac.getValues()).toEqual({
      a: 2,
      b: 4,
      c: 8,
    })
  })

  it('should init properly 4', () => {
    const defs = Object.fromEntries(
      Object.entries({
        'v00': {
          value: 1,
        },
        'v01': {
          deps: ['v00'],
          fn: (v00) => v00 + 1,
        },
        'v02': {
          deps: ['v01'],
          fn: (v01) => v01 + 1,
        },
        'v10': {
          deps: ['v00'],
          fn: (v00) => v00 * 2,
        },
        'v11': {
          deps: ['v01', 'v10'],
          fn: (v01, v10) => v01 * 2 + v10,
        },
        'v12': {
          deps: ['v02', 'v11'],
          fn: (v02, v11) => v02 * 2 + v11,
        },
        'v20': {
          deps: ['v10'],
          fn: (v10) => v10 * 2,
        },
        'v21': {
          deps: ['v11', 'v20'],
          fn: (v11, v20) => v11 * 2 + v20,
        },
        'v22': {
          deps: ['v12', 'v21'],
          fn: (v12, v21) => v12 * 2 + v21,
        },
      }).reverse()
    )
    const ac = ac130(defs)

    expect(ac.getValues()).toEqual({
      'v00': 1,
      'v01': 2,
      'v02': 3,
      'v10': 2,
      'v11': 6,
      'v12': 12,
      'v20': 4,
      'v21': 16,
      'v22': 40,
    })
  })

  it('should init properly 5', () => {
    const defs = {
      a0: {
        value: 1,
      },
      b0: {
        value: 2,
      },
      c0: {
        value: 3,
      },
      d0: {
        value: 4,
      },
      z0: {
        value: 5,
      },
      z: {
        deps: ['a', 'b', 'c', 'd'],
        fn: (a, b, c, d) => a + b + c + d,
      },
      a: {
        deps: ['a0'],
        fn: (a0) => a0 * 2,
      },
      b: {
        deps: ['b0', 'a'],
        fn: (b0, a) => b0 + a * 2,
      },
      c: {
        deps: ['c0', 'b'],
        fn: (c0, b) => c0 + b * 2,
      },
      d: {
        deps: ['d0', 'c'],
        fn: (d0, c) => d0 + c * 2,
      },
      r: {
        deps: ['r1', 'r2'],
        fn: (r1, r2) => r1 * r2,
      },
      r1: {
        deps: ['z'],
        fn: (z) => z + 1,
      },
      r2: {
        deps: ['z'],
        fn: (z) => z - 50,
      },
    }
    const ac = ac130(defs)

    expect(ac.getValues()).toEqual({
      a0: 1,
      b0: 2,
      c0: 3,
      d0: 4,
      z0: 5,
      a: 2,
      b: 6,
      c: 15,
      d: 34,
      z: 57,
      r1: 58,
      r2: 7,
      r: 406,
    })
  })

  it('should detect cycles 1', () => {
    const defs = {
      a: {
        value: null,
      },
      b: {
        deps: ['a', 'c'],
        fn: () => null,
      },
      c: {
        deps: ['b'],
        fn: () => null,
      },
    }

    expect(() => ac130(defs)).toThrow(new Error('Cycle detected: a -> b -> c -> b'))
  })

  it('should detect cycles 2', () => {
    const defs = {
      a: {
        value: null,
      },
      c: {
        deps: ['b'],
        fn: () => null,
      },
      d: {
        deps: ['c'],
        fn: () => null,
      },
      b: {
        deps: ['a', 'c'],
        fn: () => null,
      },
    }

    expect(() => ac130(defs)).toThrow(new Error('Cycle detected: a -> b -> c -> b'))
  })

  it('should detect cycles 3', () => {
    const defs = {
      a: {
        value: null,
      },
      b: {
        deps: ['a', 'b'],
        fn: () => null,
      },
    }

    expect(() => ac130(defs)).toThrow(new Error('Cycle detected: a -> b -> b'))
  })

  it('should update properly 1', () => {
    const defs = {
      a: {
        value: 10,
      },
      b: {
        deps: ['a'],
        fn: jest.fn((a) => a + 1),
      },
      c: {
        deps: ['a'],
        fn: jest.fn((a) => a - 1),
      },
      d: {
        deps: ['b'],
        fn: jest.fn((b) => b * 2),
      },
      e: {
        deps: ['b', 'c', 'z'],
        fn: jest.fn((b, c, z) => b * c - z),
      },
      f: {
        deps: ['c', 'e'],
        fn: jest.fn((c, e) => c + e),
      },
      g: {
        deps: ['d', 'f', 'z'],
        fn: jest.fn((d, f, z) => d - f * z),
      },
      z: {
        value: 11,
      },
    }
    const ac = ac130(defs)

    jest.clearAllMocks()

    const changed = ac.setValues({ z: -5 })

    expect(changed).toEqual({
      z: -5,
      e: 104,
      f: 113,
      g: 587,
    })
    expect(ac.getValues()).toEqual({
      a: 10,
      b: 11,
      c: 9,
      d: 22,
      e: 104,
      f: 113,
      g: 587,
      z: -5,
    })
    ;['b', 'c', 'd'].forEach((name) => {
      expect(defs[name].fn).toHaveBeenCalledTimes(0)
    })
    ;['e', 'f', 'g'].forEach((name) => {
      expect(defs[name].fn).toHaveBeenCalledTimes(1)
    })
  })

  it('should update properly 2', () => {
    const defs = {
      a: {
        value: 3,
      },
      b: {
        value: 4,
      },
      c: {
        deps: ['a'],
        fn: jest.fn((a) => a + 1),
      },
      d: {
        deps: ['a', 'b'],
        fn: jest.fn((a, b) => a + b),
      },
      e: {
        deps: ['b'],
        fn: jest.fn((b) => b + 1),
      },
      f: {
        deps: ['c', 'd', 'z'],
        fn: jest.fn((c, d, z) => Math.floor((c + d + z) / 10)),
      },
      g: {
        deps: ['d', 'e'],
        fn: jest.fn((d, e) => Math.floor((d + e) / 10)),
      },
      h: {
        deps: ['f', 'g'],
        fn: jest.fn((f, g) => f * g),
      },
      z: {
        value: 0,
      },
    }
    const ac = ac130(defs)

    jest.clearAllMocks()

    const changed = ac.setValues({ a: 4, b: 4 })

    expect(changed).toEqual({
      a: 4,
      c: 5,
      d: 8,
    })
    expect(ac.getValues()).toEqual({
      a: 4,
      b: 4,
      c: 5,
      d: 8,
      e: 5,
      f: 1,
      g: 1,
      h: 1,
      z: 0,
    })

    ;['e', 'h'].forEach((name) => {
      expect(defs[name].fn).toHaveBeenCalledTimes(0)
    })
    ;['c', 'd', 'f', 'g'].forEach((name) => {
      expect(defs[name].fn).toHaveBeenCalledTimes(1)
    })
  })

  it('should update properly 3', () => {
    const defs = {
      a: {
        value: 3,
      },
      b: {
        value: 4,
      },
      c: {
        deps: ['a'],
        eq: jest.fn((prev, next) => prev.value === next.value),
        fn: jest.fn((a) => ({
          value: a + 1
        })),
      },
      d: {
        deps: ['a', 'b'],
        eq: jest.fn((prev, next) => prev.value === next.value),
        fn: jest.fn((a, b) => ({
          value: a + b,
        })),
      },
      e: {
        deps: ['b'],
        eq: jest.fn((prev, next) => prev.value === next.value),
        fn: jest.fn((b) => ({
          value: b + 1,
        })),
      },
      f: {
        deps: ['c', 'd', 'z'],
        eq: jest.fn((prev, next) => prev.value === next.value),
        fn: jest.fn(({ value: c }, { value: d }, z) => ({
          value: Math.floor((c + d + z) / 10),
        })),
      },
      g: {
        deps: ['d', 'e'],
        eq: jest.fn((prev, next) => prev.value === next.value),
        fn: jest.fn(({ value: d }, { value: e }) => ({
          value: Math.floor((d + e) / 10),
        })),
      },
      h: {
        deps: ['f', 'g'],
        eq: jest.fn((prev, next) => prev.value === next.value),
        fn: jest.fn(({ value: f }, { value: g }) => ({
          value: f * g,
        })),
      },
      z: {
        value: 0,
      },
    }
    const ac = ac130(defs)

    jest.clearAllMocks()

    const changed = ac.setValues({ a: 4, b: 4 })

    expect(changed).toEqual({
      a: 4,
      c: {
        value: 5,
      },
      d: {
        value: 8,
      },
    })
    expect(ac.getValues()).toEqual({
      a: 4,
      b: 4,
      c: {
        value: 5,
      },
      d: {
        value: 8,
      },
      e: {
        value: 5,
      },
      f: {
        value: 1,
      },
      g: {
        value: 1,
      },
      h: {
        value: 1,
      },
      z: 0,
    })
    ;['e', 'h'].forEach((name) => {
      expect(defs[name].fn).toHaveBeenCalledTimes(0)
      expect(defs[name].eq).toHaveBeenCalledTimes(0)
    })
    ;['c', 'd', 'f', 'g'].forEach((name) => {
      expect(defs[name].fn).toHaveBeenCalledTimes(1)
      expect(defs[name].eq).toHaveBeenCalledTimes(1)
    })
  })

  it('should not silence errors', () => {
    const defs = {
      a: {
        value: 10,
      },
      b: {
        deps: ['a'],
        fn: (a) => a + 1,
      },
      c: {
        deps: ['a'],
        fn: (a) => a - 1,
      },
      d: {
        deps: ['b'],
        fn: (b) => b * 2,
      },
      e: {
        deps: ['b', 'c', 'z'],
        fn: (b, c, z) => b * c - z,
      },
      f: {
        deps: ['c', 'e'],
        fn: (c, e) => c + e,
      },
      g: {
        deps: ['d', 'f', 'z'],
        fn: () => {
          throw new Error('error')
        },
      },
      z: {
        value: 11,
      },
    }

    expect(() => ac130(defs)).toThrow(new Error('error'))
  })

  it('should not corrupt values in case of error', () => {
    const defs = {
      a: {
        value: 10,
      },
      b: {
        deps: ['a'],
        fn: (a) => a + 1,
      },
      c: {
        deps: ['a'],
        fn: (a) => a - 1,
      },
      d: {
        deps: ['b'],
        fn: (b) => b * 2,
      },
      e: {
        deps: ['b', 'c', 'z'],
        fn: (b, c, z) => b * c - z,
      },
      f: {
        deps: ['c', 'e'],
        fn: (c, e) => c + e,
      },
      g: {
        deps: ['d', 'f', 'z'],
        fn: jest.fn((d, f, z) => d - f * z),
      },
      z: {
        value: 11,
      },
    }
    const ac = ac130(defs)

    jest.clearAllMocks()

    defs.g.fn.mockImplementation(() => {
      throw new Error('error')
    })

    expect(() => ac.setValues({ z: -5 })).toThrow(new Error('error'))
    expect(ac.getValues()).toEqual({
      a: 10,
      b: 11,
      c: 9,
      d: 22,
      e: 88,
      f: 97,
      g: -1045,
      z: 11,
    })
  })

  it('should prevent write to computed property', () => {
    const defs = {
      a: {
        value: 5,
      },
      b: {
        deps: ['a'],
        fn: (a) => a + 1,
      },
    }

    const ac = ac130(defs)

    expect(() => ac.setValues({ b: 45 }))
      .toThrow(new Error('Write to computed property: b'))
  })
})
