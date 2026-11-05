/**
 * Unit tests for src/data/hospital.js.
 */
import { describe, it, expect } from 'vitest'
import { nextId } from '../../src/data/hospital.js'

describe('nextId', () => {
  it('returns 1 for an empty list', () => {
    expect(nextId([])).toBe(1)
  })
  it('returns one more than the highest id, even when ids are not in order', () => {
    expect(nextId([{ id: 4 }, { id: 2 }])).toBe(5)
  })
})
