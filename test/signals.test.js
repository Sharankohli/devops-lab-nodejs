/**
 * Integration tests for /api/signals (full CRUD + validation).
 */
import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

const valid = { ticker: 'AAPL', direction: 'bullish', confidence: 75, reasoning: 'Strong momentum', timeframe: '15m' }

describe('Signals API – read', () => {
  it('GET /api/signals returns the signals, newest first', async () => {
    const res = await request(app).get('/api/signals')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    const times = res.body.map((s) => s.firedAt)
    expect(times).toEqual([...times].sort().reverse())
  })

  it('GET /api/signals?ticker= filters by ticker, in any case', async () => {
    const res = await request(app).get('/api/signals?ticker=tsla')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body.every((s) => s.ticker === 'TSLA')).toBe(true)
  })

  it('GET /api/signals/:id returns one signal or 404', async () => {
    const found = await request(app).get('/api/signals/1')
    expect(found.status).toBe(200)
    expect(found.body).toEqual(expect.objectContaining({ id: 1, ticker: 'AAPL', direction: 'bullish' }))

    const missing = await request(app).get('/api/signals/999')
    expect(missing.status).toBe(404)
    expect(missing.body).toEqual({ error: 'Signal not found' })
  })
})

describe('Signals API – create', () => {
  it('POST /api/signals creates a signal with server-side firedAt and result null', async () => {
    const res = await request(app).post('/api/signals').send({ ...valid, ticker: 'aapl' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      id: expect.any(Number),
      ...valid,
      firedAt: expect.any(String),
      result: null
    })
    expect(Number.isNaN(Date.parse(res.body.firedAt))).toBe(false)

    const list = await request(app).get('/api/signals')
    expect(list.body[0]).toEqual(res.body)
  })

  it('POST uses default reasoning and timeframe when they are not sent', async () => {
    const res = await request(app).post('/api/signals').send({ ticker: 'TSLA', direction: 'bearish', confidence: 0 })
    expect(res.status).toBe(201)
    expect(res.body).toEqual(expect.objectContaining({ reasoning: '', timeframe: '1h', confidence: 0 }))
  })

  it.each(['ticker', 'direction', 'confidence'])('POST without %s returns 400', async (field) => {
    const body = { ...valid }
    delete body[field]
    const res = await request(app).post('/api/signals').send(body)
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing required fields' })
  })

  it.each([
    [{ ticker: 'XYZ' }, 'Unknown ticker'],
    [{ direction: 'up' }, 'Direction must be bullish or bearish'],
    [{ confidence: 101 }, 'Confidence must be an integer between 0 and 100'],
    [{ confidence: -1 }, 'Confidence must be an integer between 0 and 100'],
    [{ confidence: 50.5 }, 'Confidence must be an integer between 0 and 100'],
    [{ confidence: '80' }, 'Confidence must be an integer between 0 and 100'],
    [{ timeframe: '2h' }, 'Timeframe must be one of 1m, 5m, 15m, 1h, 1D'],
    [{ reasoning: 42 }, 'Reasoning must be a string']
  ])('POST with %o returns 400 "%s"', async (change, error) => {
    const res = await request(app).post('/api/signals').send({ ...valid, ...change })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error })
  })
})

describe('Signals API – update', () => {
  it('PUT /api/signals/:id resolves a signal and keeps id and firedAt', async () => {
    const before = (await request(app).get('/api/signals/2')).body
    const res = await request(app).put('/api/signals/2').send({ result: 'incorrect', confidence: 70, id: 50, firedAt: 'x' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ...before, result: 'incorrect', confidence: 70 })

    const after = await request(app).get('/api/signals/2')
    expect(after.body).toEqual(res.body)
  })

  it('PUT can change the ticker (stored in upper case) and reset the result to null', async () => {
    const res = await request(app).put('/api/signals/1').send({ ticker: 'btc-usd', result: null })
    expect(res.status).toBe(200)
    expect(res.body).toEqual(expect.objectContaining({ ticker: 'BTC-USD', result: null }))
  })

  it('PUT with an invalid value or an emptied required field returns 400', async () => {
    const bad = await request(app).put('/api/signals/1').send({ result: 'maybe' })
    expect(bad.status).toBe(400)
    expect(bad.body).toEqual({ error: 'Result must be correct, incorrect or null' })

    const emptied = await request(app).put('/api/signals/1').send({ direction: '' })
    expect(emptied.status).toBe(400)
    expect(emptied.body).toEqual({ error: 'Missing required fields' })
  })

  it('PUT on an unknown id returns 404', async () => {
    const res = await request(app).put('/api/signals/999').send({ result: 'correct' })
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Signal not found' })
  })
})

describe('Signals API – delete', () => {
  it('DELETE /api/signals/:id removes the signal', async () => {
    const created = await request(app).post('/api/signals').send(valid)
    const res = await request(app).delete(`/api/signals/${created.body.id}`)
    expect(res.status).toBe(204)
    expect(res.body).toEqual({})

    const gone = await request(app).get(`/api/signals/${created.body.id}`)
    expect(gone.status).toBe(404)
  })

  it('DELETE on an unknown id returns 404', async () => {
    const res = await request(app).delete('/api/signals/999')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Signal not found' })
  })
})
