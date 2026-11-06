import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

const error = 'Name must be non-blank and age must be a non-negative integer'

describe('/api/patients', () => {
  it('GET returns patient records as JSON', async () => {
    const res = await request(app).get('/api/patients')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body.length).toBeGreaterThan(0)
    for (const patient of res.body) {
      expect(patient).toEqual({ id: expect.any(Number), name: expect.any(String), age: expect.any(Number) })
    }
  })

  it.each([29, 0])('POST creates a patient aged %s, trims the name and persists the record', async (age) => {
    const before = await request(app).get('/api/patients')
    const nextId = before.body.reduce((max, patient) => Math.max(max, patient.id), 0) + 1
    const res = await request(app).post('/api/patients').send({ name: '  Marie  ', age })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: nextId, name: 'Marie', age })

    const after = await request(app).get('/api/patients')
    expect(after.body).toEqual([...before.body, res.body])
  })

  it.each([
    ['missing name', { age: 29 }],
    ['blank name', { name: '  ', age: 29 }],
    ['numeric name', { name: 123, age: 29 }],
    ['null name', { name: null, age: 29 }],
    ['missing age', { name: 'Marie' }],
    ['negative age', { name: 'Marie', age: -1 }],
    ['fractional age', { name: 'Marie', age: 2.5 }],
    ['string age', { name: 'Marie', age: '29' }],
    ['blank age', { name: 'Marie', age: '' }],
    ['null age', { name: 'Marie', age: null }],
    ['boolean age', { name: 'Marie', age: true }],
    ['array age', { name: 'Marie', age: [] }],
    ['object age', { name: 'Marie', age: {} }],
    ['empty object', {}],
    ['no body', undefined]
  ])('POST rejects %s without changing patients', async (_label, body) => {
    const before = await request(app).get('/api/patients')
    const req = request(app).post('/api/patients')
    const res = body === undefined ? await req : await req.send(body)

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error })
    const after = await request(app).get('/api/patients')
    expect(after.body).toEqual(before.body)
  })
})
