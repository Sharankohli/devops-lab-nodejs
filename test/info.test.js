/**
 * Integration test for GET /info.
 * Validates the merged info object from helpers.
 */
import request from 'supertest'
import { readFileSync } from 'node:fs'
import app from '../src/app.js'
import { afterEach, describe, it, expect, vi } from 'vitest'

const { name, version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

afterEach(() => vi.restoreAllMocks())

describe('GET /info', () => {
  it('returns the exact app metadata and current runtime as JSON', async () => {
    const before = process.uptime()
    const res = await request(app).get('/info')
    const after = process.uptime()

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body).toEqual({ name, version, node: process.version, uptime: expect.any(Number) })
    expect(res.body.uptime).toBeGreaterThanOrEqual(before)
    expect(res.body.uptime).toBeLessThanOrEqual(after)
  })

  it('reports fresh uptime in seconds on each request, including zero and fractions', async () => {
    const uptime = vi.spyOn(process, 'uptime').mockReturnValue(0)
    const first = await request(app).get('/info')
    uptime.mockReturnValue(123.456)
    const second = await request(app).get('/info')

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(first.body).toEqual({ name, version, node: process.version, uptime: 0 })
    expect(second.body).toEqual({ name, version, node: process.version, uptime: 123.456 })
  })
})
