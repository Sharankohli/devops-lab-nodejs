/**
 * Integration tests for /api/tickers (full CRUD + validation).
 */
import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

const valid = { symbol: 'msft', name: 'Microsoft Corporation', exchange: 'NASDAQ' }

describe('Tickers API – read', () => {
  it('GET /api/tickers returns the list of tickers', async () => {
    const res = await request(app).get('/api/tickers')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toContainEqual({ id: 1, symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' })
  })

  it('GET /api/tickers/:id returns one ticker', async () => {
    const res = await request(app).get('/api/tickers/2')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(expect.objectContaining({ id: 2, symbol: 'TSLA' }))
  })

  it('GET /api/tickers/:id on an unknown id returns 404', async () => {
    const res = await request(app).get('/api/tickers/999')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Ticker not found' })
  })
})

describe('Tickers API – create', () => {
  it('POST /api/tickers creates a ticker with the symbol in upper case', async () => {
    const res = await request(app).post('/api/tickers').send(valid)
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: expect.any(Number), ...valid, symbol: 'MSFT' })

    const list = await request(app).get('/api/tickers')
    expect(list.body).toContainEqual(res.body)
  })

  it.each(['symbol', 'name', 'exchange'])('POST without %s returns 400', async (field) => {
    const body = { ...valid, symbol: 'NVDA' }
    delete body[field]
    const res = await request(app).post('/api/tickers').send(body)
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing required fields' })
  })

  it.each([{ symbol: '  ' }, { name: 42 }])('POST with a blank or non-string field %o returns 400', async (change) => {
    const res = await request(app).post('/api/tickers').send({ ...valid, symbol: 'NVDA', ...change })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing required fields' })
  })

  it('POST with a symbol already used (any case) returns 409', async () => {
    const res = await request(app).post('/api/tickers').send({ ...valid, symbol: 'aapl' })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'Ticker already exists' })
  })
})

describe('Tickers API – update', () => {
  it('PUT /api/tickers/:id updates the ticker and keeps its id', async () => {
    const created = (await request(app).post('/api/tickers').send({ ...valid, symbol: 'AMZN', name: 'Amazon' })).body
    const res = await request(app).put(`/api/tickers/${created.id}`).send({ symbol: 'amzn', name: 'Amazon.com, Inc.', id: 500 })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ...created, symbol: 'AMZN', name: 'Amazon.com, Inc.' })

    const after = await request(app).get(`/api/tickers/${created.id}`)
    expect(after.body).toEqual(res.body)
  })

  it('PUT can change the symbol to a new one (stored in upper case)', async () => {
    const created = (await request(app).post('/api/tickers').send({ ...valid, symbol: 'GOOG' })).body
    const res = await request(app).put(`/api/tickers/${created.id}`).send({ symbol: 'googl' })
    expect(res.status).toBe(200)
    expect(res.body.symbol).toBe('GOOGL')
  })

  it('PUT changing to a symbol already used returns 409', async () => {
    const res = await request(app).put('/api/tickers/2').send({ symbol: 'aapl' })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'Ticker already exists' })

    const unchanged = await request(app).get('/api/tickers/2')
    expect(unchanged.body.symbol).toBe('TSLA')
  })

  it('PUT with an emptied field returns 400', async () => {
    const res = await request(app).put('/api/tickers/1').send({ name: '' })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing required fields' })
  })

  it('PUT on an unknown id returns 404', async () => {
    const res = await request(app).put('/api/tickers/999').send({ name: 'Nobody' })
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Ticker not found' })
  })
})

describe('Tickers API – delete', () => {
  it('DELETE /api/tickers/:id removes the ticker', async () => {
    const created = await request(app).post('/api/tickers').send({ ...valid, symbol: 'META', name: 'Meta Platforms' })
    const res = await request(app).delete(`/api/tickers/${created.body.id}`)
    expect(res.status).toBe(204)
    expect(res.body).toEqual({})

    const gone = await request(app).get(`/api/tickers/${created.body.id}`)
    expect(gone.status).toBe(404)
  })

  it('DELETE on an unknown id returns 404', async () => {
    const res = await request(app).delete('/api/tickers/999')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Ticker not found' })
  })
})
