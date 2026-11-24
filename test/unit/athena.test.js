/**
 * Unit tests for src/data/athena.js.
 */
import { describe, it, expect } from 'vitest'
import { tickers, indexById, isKnownTicker, isMissing, nextId } from '../../src/data/athena.js'

describe('Athena data helpers', () => {
  it('indexById finds an item from a route parameter string', () => {
    expect(indexById(tickers, '2')).toBe(1)
    expect(indexById(tickers, '999')).toBe(-1)
    expect(indexById(tickers, 'abc')).toBe(-1)
  })

  it('isKnownTicker accepts known symbols in any case and rejects the rest', () => {
    expect(isKnownTicker('AAPL')).toBe(true)
    expect(isKnownTicker('tsla')).toBe(true)
    expect(isKnownTicker('XYZ')).toBe(false)
    expect(isKnownTicker(42)).toBe(false)
  })

  it('isMissing treats undefined, null and blank strings as missing', () => {
    for (const v of [undefined, null, '', '   ']) expect(isMissing(v)).toBe(true)
    for (const v of ['x', 0, false, []]) expect(isMissing(v)).toBe(false)
  })

  it('re-exports nextId', () => {
    expect(nextId(tickers)).toBe(4)
  })
})
