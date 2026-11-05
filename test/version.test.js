/**
 * Integration test for GET /version.
 * Focus: HTTP behavior & payload shape.
 */
import request from 'supertest'
import fs, { readFileSync } from 'node:fs'
import app from '../src/app.js'
import { afterEach, describe, it, expect, vi } from 'vitest'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

afterEach(() => vi.restoreAllMocks())

describe('GET /version', () => {
  it('returns exactly the package.json version as JSON', async () => {
    const res = await request(app).get('/version')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body).toEqual({ version })
  })

  it('does not read package.json on each request', async () => {
    const read = vi.spyOn(fs, 'readFileSync')
    const first = await request(app).get('/version')
    const second = await request(app).get('/version')

    expect(first.body).toEqual({ version })
    expect(second.body).toEqual({ version })
    expect(read).not.toHaveBeenCalled()
  })
})
