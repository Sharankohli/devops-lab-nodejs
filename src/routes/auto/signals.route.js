/**
 * /api/signals → CRUD for AI signals (Athena SDD 4.1).
 *   GET    /api/signals[?ticker=AAPL]  → list, newest first
 *   GET    /api/signals/:id            → one signal
 *   POST   /api/signals                → { ticker, direction, confidence, reasoning?, timeframe? } (201)
 *   PUT    /api/signals/:id            → update fields, e.g. { result: 'correct' }
 *   DELETE /api/signals/:id            → 204
 */
import { Router } from 'express'
import {
  signals, nextId, indexById, isKnownTicker, isMissing,
  DIRECTIONS, TIMEFRAMES, RESULTS
} from '../../data/athena.js'

const router = Router()
const REQUIRED = ['ticker', 'direction', 'confidence']
const NOT_FOUND = { error: 'Signal not found' }

// Checks the fields that are present (SDD 4.2); returns an error message or null
function invalidField ({ ticker, direction, confidence, timeframe, result, reasoning }) {
  if (ticker !== undefined && !isKnownTicker(ticker)) return 'Unknown ticker'
  if (direction !== undefined && !DIRECTIONS.includes(direction)) return 'Direction must be bullish or bearish'
  if (confidence !== undefined && !(Number.isInteger(confidence) && confidence >= 0 && confidence <= 100)) {
    return 'Confidence must be an integer between 0 and 100'
  }
  if (timeframe !== undefined && !TIMEFRAMES.includes(timeframe)) return `Timeframe must be one of ${TIMEFRAMES.join(', ')}`
  if (result !== undefined && result !== null && !RESULTS.includes(result)) return 'Result must be correct, incorrect or null'
  if (reasoning !== undefined && typeof reasoning !== 'string') return 'Reasoning must be a string'
  return null
}

router.get('/api/signals', (req, res) => {
  const ticker = req.query.ticker
  const list = ticker ? signals.filter((s) => s.ticker === String(ticker).toUpperCase()) : signals
  res.status(200).json([...list].sort((a, b) => b.firedAt.localeCompare(a.firedAt)))
})

router.get('/api/signals/:id', (req, res) => {
  const index = indexById(signals, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)
  res.status(200).json(signals[index])
})

router.post('/api/signals', (req, res) => {
  const body = req.body
  if (REQUIRED.some((field) => isMissing(body[field]))) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const problem = invalidField({ ...body, result: undefined })
  if (problem) return res.status(400).json({ error: problem })

  const signal = {
    id: nextId(signals),
    ticker: body.ticker.toUpperCase(),
    direction: body.direction,
    confidence: body.confidence,
    reasoning: body.reasoning ?? '',
    timeframe: body.timeframe ?? '1h',
    firedAt: new Date().toISOString(),
    result: null
  }
  signals.push(signal)
  res.status(201).json(signal)
})

router.put('/api/signals/:id', (req, res) => {
  const index = indexById(signals, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)

  const body = req.body
  if (REQUIRED.some((field) => field in body && isMissing(body[field]))) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const problem = invalidField(body)
  if (problem) return res.status(400).json({ error: problem })

  // Only these fields can change: id and firedAt stay as they are
  const updated = { ...signals[index] }
  for (const field of ['ticker', 'direction', 'confidence', 'reasoning', 'timeframe', 'result']) {
    if (field in body) updated[field] = body[field]
  }
  updated.ticker = updated.ticker.toUpperCase()
  signals[index] = updated
  res.status(200).json(updated)
})

router.delete('/api/signals/:id', (req, res) => {
  const index = indexById(signals, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)
  signals.splice(index, 1)
  res.status(204).end()
})

export default router
