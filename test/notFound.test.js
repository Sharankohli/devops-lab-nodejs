/**
 * Integration tests for unknown routes and invalid JSON bodies.
 */
import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('Error responses', () => {
  it('an unknown route answers 404 as JSON', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Not found' })
  })

  it('an invalid JSON body answers 400 instead of crashing', async () => {
    const res = await request(app)
      .post('/api/doctors')
      .set('Content-Type', 'application/json')
      .send('{ "name": ')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })
})
