/**
 * Unit tests for src/utils/appInfo.js.
 * No HTTP or Express involved; just pure functions.
 */
import { readFileSync } from 'node:fs'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { getPackageInfo, getRuntimeInfo } from '../../src/utils/appInfo.js'

const { name, version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

afterEach(() => vi.restoreAllMocks())

describe('getPackageInfo', () => {
  it('returns exactly the name and version from package.json', () => {
    expect(getPackageInfo()).toEqual({ name, version })
  })
})

describe('getRuntimeInfo', () => {
  it('returns the current Node version and uptime in seconds', () => {
    const before = process.uptime()
    const runtime = getRuntimeInfo()
    const after = process.uptime()

    expect(runtime).toEqual({ node: process.version, uptime: expect.any(Number) })
    expect(runtime.uptime).toBeGreaterThanOrEqual(before)
    expect(runtime.uptime).toBeLessThanOrEqual(after)
  })

  it('reads uptime on each call without rounding or caching it', () => {
    const uptime = vi.spyOn(process, 'uptime').mockReturnValueOnce(0).mockReturnValueOnce(12.345)

    expect(getRuntimeInfo()).toEqual({ node: process.version, uptime: 0 })
    expect(getRuntimeInfo()).toEqual({ node: process.version, uptime: 12.345 })
    expect(uptime).toHaveBeenCalledTimes(2)
  })
})
