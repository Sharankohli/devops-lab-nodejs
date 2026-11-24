/**
 * Integration tests for /api/watchlist (full CRUD + validation).
 */
import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'
import { tickers, watchlist, signals } from '../src/data/athena.js'

describe('Watchlist API – read', () => {
  it('GET /api/watchlist returns the watchlist items', async () => {
    const res = await request(app).get('/api/watchlist')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0]).toEqual(expect.objectContaining({ id: 1, ticker: 'AAPL', alertEnabled: true, alertChannel: 'push' }))
  })

  it('GET /api/watchlist/:id returns one item or 404', async () => {
    const found = await request(app).get('/api/watchlist/1')
    expect(found.status).toBe(200)
    expect(found.body.ticker).toBe('AAPL')

    const missing = await request(app).get('/api/watchlist/999')
    expect(missing.status).toBe(404)
    expect(missing.body).toEqual({ error: 'Watchlist item not found' })
  })
})

describe('Watchlist API – create', () => {
  it('POST /api/watchlist adds a ticker with default alert settings', async () => {
    const res = await request(app).post('/api/watchlist').send({ ticker: 'tsla' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      id: expect.any(Number),
      ticker: 'TSLA',
      addedAt: expect.any(String),
      alertEnabled: false,
      alertChannel: 'in-app'
    })
  })

  it('POST keeps the alert settings that are sent', async () => {
    const res = await request(app).post('/api/watchlist').send({ ticker: 'BTC-USD', alertEnabled: true, alertChannel: 'email' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual(expect.objectContaining({ alertEnabled: true, alertChannel: 'email' }))
  })

  it('POST without a ticker returns 400', async () => {
    const res = await request(app).post('/api/watchlist').send({ alertEnabled: true })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing required fields' })
  })

  it.each([
    [{ ticker: 'XYZ' }, 'Unknown ticker'],
    [{ ticker: 'AAPL', alertEnabled: 'yes' }, 'alertEnabled must be true or false'],
    [{ ticker: 'AAPL', alertChannel: 'sms' }, 'alertChannel must be one of push, email, in-app']
  ])('POST with %o returns 400 "%s"', async (body, error) => {
    const res = await request(app).post('/api/watchlist').send(body)
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error })
  })

  it('POST the same ticker twice returns 409', async () => {
    const res = await request(app).post('/api/watchlist').send({ ticker: 'aapl' })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'Ticker already in watchlist' })
  })

  it('POST when the watchlist already has 10 items returns 409', async () => {
    // Fill the watchlist up to 10 with extra known tickers
    const added = []
    for (let i = watchlist.length; i < 10; i++) {
      const symbol = `TEST${i}`
      tickers.push({ id: 100 + i, symbol, name: symbol, exchange: 'TEST' })
      const res = await request(app).post('/api/watchlist').send({ ticker: symbol })
      expect(res.status).toBe(201)
      added.push(res.body.id)
    }
    tickers.push({ id: 200, symbol: 'EXTRA', name: 'Extra', exchange: 'TEST' })

    const full = await request(app).post('/api/watchlist').send({ ticker: 'EXTRA' })
    expect(full.status).toBe(409)
    expect(full.body).toEqual({ error: 'Watchlist is full' })

    for (const id of added) await request(app).delete(`/api/watchlist/${id}`)
  })
})

describe('Watchlist API – update', () => {
  it('PUT /api/watchlist/:id changes the alert settings and keeps id and addedAt', async () => {
    const before = (await request(app).get('/api/watchlist/1')).body
    const res = await request(app).put('/api/watchlist/1').send({ alertEnabled: false, alertChannel: 'email', id: 7, addedAt: 'x' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ...before, alertEnabled: false, alertChannel: 'email' })
  })

  it('PUT can move an item to another ticker, but not to one already in the list', async () => {
    const created = await request(app).post('/api/watchlist').send({ ticker: 'EXTRA' })
    const moved = await request(app).put(`/api/watchlist/${created.body.id}`).send({ ticker: 'extra' })
    expect(moved.status).toBe(200)
    expect(moved.body.ticker).toBe('EXTRA')

    const clash = await request(app).put(`/api/watchlist/${created.body.id}`).send({ ticker: 'AAPL' })
    expect(clash.status).toBe(409)
    expect(clash.body).toEqual({ error: 'Ticker already in watchlist' })
  })

  it('PUT with an invalid value or an emptied ticker returns 400', async () => {
    const bad = await request(app).put('/api/watchlist/1').send({ alertChannel: 'pigeon' })
    expect(bad.status).toBe(400)

    const emptied = await request(app).put('/api/watchlist/1').send({ ticker: ' ' })
    expect(emptied.status).toBe(400)
    expect(emptied.body).toEqual({ error: 'Missing required fields' })
  })

  it('PUT on an unknown id returns 404', async () => {
    const res = await request(app).put('/api/watchlist/999').send({ alertEnabled: true })
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Watchlist item not found' })
  })
})

describe('Watchlist API – delete', () => {
  it('DELETE /api/watchlist/:id removes the item but keeps the ticker signals', async () => {
    const signalsBefore = signals.length
    const res = await request(app).delete('/api/watchlist/1')
    expect(res.status).toBe(204)

    const gone = await request(app).get('/api/watchlist/1')
    expect(gone.status).toBe(404)
    expect(signals.length).toBe(signalsBefore)
  })

  it('DELETE on an unknown id returns 404', async () => {
    const res = await request(app).delete('/api/watchlist/999')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Watchlist item not found' })
  })
})
