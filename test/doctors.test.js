/**
 * Integration test for /api/doctors (list + create + validation).
 */
import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('/api/doctors', () => {
  it('GET returns 200 and a JSON array of doctors { id, name, specialty }', async () => {
    const res = await request(app).get('/api/doctors')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    for (const d of res.body) {
      expect(d).toEqual({ id: expect.any(Number), name: expect.any(String), specialty: expect.any(String) })
    }
  })

  it('POST with { name, specialty } returns 201 and the new doctor with a generated id', async () => {
    const before = await request(app).get('/api/doctors')
    const res = await request(app)
      .post('/api/doctors')
      .send({ name: 'Dr. Chloe Bernard', specialty: 'Neurology' })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: expect.any(Number), name: 'Dr. Chloe Bernard', specialty: 'Neurology' })
    expect(before.body.map(d => d.id)).not.toContain(res.body.id)

    const after = await request(app).get('/api/doctors')
    expect(after.body).toContainEqual(res.body)
    expect(after.body).toHaveLength(before.body.length + 1)
  })

  it.each([
    ['name missing', { specialty: 'Neurology' }],
    ['specialty missing', { name: 'Dr. X' }],
    ['empty name', { name: '  ', specialty: 'Neurology' }],
    ['no body', undefined]
  ])('POST with %s returns 400 { error: "Missing required fields" }', async (_label, body) => {
    const before = await request(app).get('/api/doctors')
    const req = request(app).post('/api/doctors')
    const res = body === undefined ? await req : await req.send(body)

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing required fields' })
    const after = await request(app).get('/api/doctors')
    expect(after.body).toHaveLength(before.body.length)
  })
})
