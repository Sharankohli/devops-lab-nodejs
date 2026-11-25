/**
 * /api/tickers → CRUD for known tickers (Athena SDD 4.1).
 *   GET    /api/tickers      → list
 *   GET    /api/tickers/:id  → one ticker
 *   POST   /api/tickers      → { symbol, name, exchange } (201, symbol stored in upper case)
 *   PUT    /api/tickers/:id  → update symbol, name and/or exchange
 *   DELETE /api/tickers/:id  → 204
 */
import { Router } from 'express'
import { tickers, nextId, indexById, isMissing } from '../../data/athena.js'

const router = Router()
const FIELDS = ['symbol', 'name', 'exchange']
const NOT_FOUND = { error: 'Ticker not found' }
const MISSING = { error: 'Missing required fields' }
const DUPLICATE = { error: 'Ticker already exists' }

// True if another ticker (not the one at exceptIndex) already uses this symbol
function symbolTaken (symbol, exceptIndex = -1) {
  return tickers.some((t, i) => i !== exceptIndex && t.symbol === symbol)
}

router.get('/api/tickers', (_req, res) => {
  res.status(200).json(tickers)
})

router.get('/api/tickers/:id', (req, res) => {
  const index = indexById(tickers, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)
  res.status(200).json(tickers[index])
})

router.post('/api/tickers', (req, res) => {
  const body = req.body
  if (FIELDS.some((field) => isMissing(body[field]) || typeof body[field] !== 'string')) {
    return res.status(400).json(MISSING)
  }
  const symbol = body.symbol.trim().toUpperCase()
  if (symbolTaken(symbol)) return res.status(409).json(DUPLICATE)

  const ticker = {
    id: nextId(tickers),
    symbol,
    name: body.name.trim(),
    exchange: body.exchange.trim()
  }
  tickers.push(ticker)
  res.status(201).json(ticker)
})

router.put('/api/tickers/:id', (req, res) => {
  const index = indexById(tickers, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)

  const body = req.body
  if (FIELDS.some((field) => field in body && (isMissing(body[field]) || typeof body[field] !== 'string'))) {
    return res.status(400).json(MISSING)
  }

  // Only these fields can change: id stays as it is
  const updated = { ...tickers[index] }
  for (const field of FIELDS) {
    if (field in body) updated[field] = body[field].trim()
  }
  updated.symbol = updated.symbol.toUpperCase()
  if (symbolTaken(updated.symbol, index)) return res.status(409).json(DUPLICATE)

  tickers[index] = updated
  res.status(200).json(updated)
})

router.delete('/api/tickers/:id', (req, res) => {
  const index = indexById(tickers, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)
  tickers.splice(index, 1)
  res.status(204).end()
})

export default router
