/**
 * Integration tests for /api/alerts (full CRUD + validation).
 */
import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

const valid = { signalId: 1, channel: 'email' }

describe('Alerts API – read', () => {
  it('GET /api/alerts returns the list of alerts', async () => {
    const res = await request(app).get('/api/alerts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toContainEqual({ id: 1, signalId: 1, channel: 'push', sentAt: '2026-11-20T14:30:05.000Z', delivered: true })
  })

  it('GET /api/alerts/:id returns one alert', async () => {
    const res = await request(app).get('/api/alerts/1')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(expect.objectContaining({ id: 1, signalId: 1, channel: 'push' }))
  })

  it.each(['999', 'abc'])('GET /api/alerts/%s returns 404', async (id) => {
    const res = await request(app).get(`/api/alerts/${id}`)
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Alert not found' })
  })
})

describe('Alerts API – create', () => {
  it('POST /api/alerts creates an alert with sentAt from the server and delivered false', async () => {
    const before = Date.now()
    const res = await request(app).post('/api/alerts').send({ ...valid, sentAt: '2000-01-01T00:00:00.000Z' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: expect.any(Number), ...valid, sentAt: expect.any(String), delivered: false })
    const sentAt = Date.parse(res.body.sentAt)
    expect(sentAt).toBeGreaterThanOrEqual(before)
    expect(sentAt).toBeLessThanOrEqual(Date.now())

    const list = await request(app).get('/api/alerts')
    expect(list.body).toContainEqual(res.body)
  })

  it('POST accepts an optional delivered', async () => {
    const res = await request(app).post('/api/alerts').send({ signalId: 2, channel: 'in-app', delivered: true })
    expect(res.status).toBe(201)
    expect(res.body.delivered).toBe(true)
  })

  it.each(['signalId', 'channel'])('POST without %s returns 400', async (field) => {
    const body = { ...valid }
    delete body[field]
    const res = await request(app).post('/api/alerts').send(body)
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing required fields' })
  })

  it.each([999, '1', true])('POST with signalId %o that is not an existing signal returns 400', async (signalId) => {
    const res = await request(app).post('/api/alerts').send({ ...valid, signalId })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Unknown signal' })
  })

  it.each(['sms', 'PUSH', 42])('POST with channel %o returns 400', async (channel) => {
    const res = await request(app).post('/api/alerts').send({ ...valid, channel })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Channel must be one of push, email, in-app' })
  })

  it.each(['true', 1, null])('POST with delivered %o returns 400', async (delivered) => {
    const res = await request(app).post('/api/alerts').send({ ...valid, delivered })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Delivered must be a boolean' })
  })
})

describe('Alerts API – update', () => {
  it('PUT /api/alerts/:id marks the alert delivered and keeps id and sentAt', async () => {
    const created = (await request(app).post('/api/alerts').send(valid)).body
    const res = await request(app).put(`/api/alerts/${created.id}`).send({ delivered: true, id: 500, sentAt: '2000-01-01T00:00:00.000Z' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ...created, delivered: true })

    const after = await request(app).get(`/api/alerts/${created.id}`)
    expect(after.body).toEqual(res.body)
  })

  it('PUT can change signalId and channel', async () => {
    const created = (await request(app).post('/api/alerts').send(valid)).body
    const res = await request(app).put(`/api/alerts/${created.id}`).send({ signalId: 2, channel: 'push' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ...created, signalId: 2, channel: 'push' })
  })

  it.each([
    [{ channel: '' }, 'Missing required fields'],
    [{ signalId: null }, 'Missing required fields'],
    [{ signalId: 999 }, 'Unknown signal'],
    [{ channel: 'sms' }, 'Channel must be one of push, email, in-app'],
    [{ delivered: 'yes' }, 'Delivered must be a boolean']
  ])('PUT with %o returns 400 and leaves the alert unchanged', async (body, error) => {
    const before = (await request(app).get('/api/alerts/1')).body
    const res = await request(app).put('/api/alerts/1').send(body)
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error })

    const after = await request(app).get('/api/alerts/1')
    expect(after.body).toEqual(before)
  })

  it('PUT on an unknown id returns 404', async () => {
    const res = await request(app).put('/api/alerts/999').send({ delivered: true })
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Alert not found' })
  })
})

describe('Alerts API – delete', () => {
  it('DELETE /api/alerts/:id removes the alert', async () => {
    const created = (await request(app).post('/api/alerts').send(valid)).body
    const res = await request(app).delete(`/api/alerts/${created.id}`)
    expect(res.status).toBe(204)
    expect(res.body).toEqual({})

    const gone = await request(app).get(`/api/alerts/${created.id}`)
    expect(gone.status).toBe(404)
  })

  it('DELETE on an unknown id returns 404', async () => {
    const res = await request(app).delete('/api/alerts/999')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Alert not found' })
  })
})
