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

  it('should update properly', () => {
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
