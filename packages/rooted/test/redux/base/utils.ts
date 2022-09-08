import formatProdErrorMessage from '../../src/utils/formatProdErrorMessage'

describe('formatProdErrorMessage', () => {
  it('returns message with expected code references', () => {
    const code = 16

    const errorMessage = formatProdErrorMessage(code)

    expect(errorMessage).toContain(`#${code}`)
    expect(errorMessage).toContain(`code=${code}`)
  })
})
import { expect } from 'expect'
import isPlainObject from '../../src/utils/isPlainObject'
import vm from 'vm'

describe('isPlainObject', () => {
  it('returns true only if plain object', () => {
    const sandbox = { fromAnotherRealm: false }
    vm.runInNewContext('fromAnotherRealm = {}', sandbox)

    expect(isPlainObject(sandbox.fromAnotherRealm)).toBe(true)
    expect(isPlainObject(new Date())).toBe(false)
    expect(isPlainObject([1, 2, 3])).toBe(false)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject(undefined)).toBe(false)
    expect(isPlainObject({ x: 1, y: 2 })).toBe(true)
  })
})
/* eslint-disable no-console */
import warning from '../../src/utils/warning'

describe('Utils', () => {
  describe('warning', () => {
    it('calls console.error when available', () => {
      const preSpy = console.error
      const spy = jest.fn()
      console.error = spy
      try {
        warning('Test')
        expect(spy.mock.calls[0][0]).toBe('Test')
      } finally {
        spy.mockClear()
        console.error = preSpy
      }
    })

    it('does not throw when console.error is not available', () => {
      const realConsole = global.console
      Object.defineProperty(global, 'console', { value: {} })
      try {
        expect(() => warning('Test')).not.toThrow()
      } finally {
        Object.defineProperty(global, 'console', { value: realConsole })
      }
    })

    it('does not throw when console is not available', () => {
      const realConsole = global.console
      Object.defineProperty(global, 'console', { value: undefined })
      try {
        expect(() => warning('Test')).not.toThrow()
      } finally {
        Object.defineProperty(global, 'console', { value: realConsole })
      }
    })
  })
})
