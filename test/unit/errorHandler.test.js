/**
 * Unit tests for src/utils/errorHandler.js.
 * We stub a minimal `res` object to capture status and body.
 */
import { afterEach, describe, it, expect, vi } from 'vitest'
import { errorHandler, notFound } from '../../src/utils/errorHandler.js'

function makeRes () {
  return {
    statusCode: 0,
    body: null,
    status (code) { this.statusCode = code; return this },
    json (obj) { this.body = obj; return this }
  }
}

afterEach(() => vi.restoreAllMocks())

describe('errorHandler', () => {
  it('answers 500 "Internal server error" and logs an unexpected error', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('db exploded')
    const res = makeRes()
    errorHandler(err, {}, res, () => {})
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(log).toHaveBeenCalledWith(err)
  })

  it('keeps the status and message of an error created on purpose', () => {
    const res = makeRes()
    errorHandler({ status: 418, message: 'teapot' }, {}, res, () => {})
    expect(res.statusCode).toBe(418)
    expect(res.body).toEqual({ error: true, message: 'teapot' })
  })

  it('accepts statusCode and a missing message', () => {
    const res = makeRes()
    errorHandler({ statusCode: 400 }, {}, res, () => {})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: true, message: 'Error' })
  })
})

describe('notFound', () => {
  it('answers 404 { error: "Not found" }', () => {
    const res = makeRes()
    notFound({}, res)
    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ error: 'Not found' })
  })
})
