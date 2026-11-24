/**
 * /api/watchlist → CRUD for the tickers a trader follows (Athena SDD 4.1, V1).
 *   GET    /api/watchlist       → list
 *   GET    /api/watchlist/:id   → one item
 *   POST   /api/watchlist       → { ticker, alertEnabled?, alertChannel? } (201)
 *   PUT    /api/watchlist/:id   → update, e.g. { alertEnabled: true, alertChannel: 'email' }
 *   DELETE /api/watchlist/:id   → 204 (the ticker's signals are kept)
 */
import { Router } from 'express'
import {
  watchlist, nextId, indexById, isKnownTicker, isMissing,
  ALERT_CHANNELS, WATCHLIST_MAX
} from '../../data/athena.js'

const router = Router()
const NOT_FOUND = { error: 'Watchlist item not found' }

// Checks the fields that are present (SDD 4.2); returns an error message or null
function invalidField ({ ticker, alertEnabled, alertChannel }) {
  if (ticker !== undefined && !isKnownTicker(ticker)) return 'Unknown ticker'
  if (alertEnabled !== undefined && typeof alertEnabled !== 'boolean') return 'alertEnabled must be true or false'
  if (alertChannel !== undefined && !ALERT_CHANNELS.includes(alertChannel)) {
    return `alertChannel must be one of ${ALERT_CHANNELS.join(', ')}`
  }
  return null
}

// One entry per ticker (SDD 4.2 unique constraint); `exceptId` skips the item being updated
function isDuplicate (ticker, exceptId) {
  return watchlist.some((item) => item.ticker === ticker.toUpperCase() && item.id !== exceptId)
}

router.get('/api/watchlist', (_req, res) => {
  res.status(200).json(watchlist)
})

router.get('/api/watchlist/:id', (req, res) => {
  const index = indexById(watchlist, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)
  res.status(200).json(watchlist[index])
})

router.post('/api/watchlist', (req, res) => {
  const body = req.body
  if (isMissing(body.ticker)) return res.status(400).json({ error: 'Missing required fields' })
  const problem = invalidField(body)
  if (problem) return res.status(400).json({ error: problem })
  if (isDuplicate(body.ticker)) return res.status(409).json({ error: 'Ticker already in watchlist' })
  if (watchlist.length >= WATCHLIST_MAX) return res.status(409).json({ error: 'Watchlist is full' })

  const item = {
    id: nextId(watchlist),
    ticker: body.ticker.toUpperCase(),
    addedAt: new Date().toISOString(),
    alertEnabled: body.alertEnabled ?? false,
    alertChannel: body.alertChannel ?? 'in-app'
  }
  watchlist.push(item)
  res.status(201).json(item)
})

router.put('/api/watchlist/:id', (req, res) => {
  const index = indexById(watchlist, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)

  const body = req.body
  if ('ticker' in body && isMissing(body.ticker)) return res.status(400).json({ error: 'Missing required fields' })
  const problem = invalidField(body)
  if (problem) return res.status(400).json({ error: problem })
  if (body.ticker !== undefined && isDuplicate(body.ticker, watchlist[index].id)) {
    return res.status(409).json({ error: 'Ticker already in watchlist' })
  }

  // Only these fields can change: id and addedAt stay as they are
  const updated = { ...watchlist[index] }
  if (body.ticker !== undefined) updated.ticker = body.ticker.toUpperCase()
  if (body.alertEnabled !== undefined) updated.alertEnabled = body.alertEnabled
  if (body.alertChannel !== undefined) updated.alertChannel = body.alertChannel
  watchlist[index] = updated
  res.status(200).json(updated)
})

router.delete('/api/watchlist/:id', (req, res) => {
  const index = indexById(watchlist, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)
  watchlist.splice(index, 1)
  res.status(204).end()
})

export default router
