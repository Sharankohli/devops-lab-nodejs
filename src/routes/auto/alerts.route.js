/**
 * /api/alerts → CRUD for alerts sent when a signal flips (Athena SDD 4.1).
 *   GET    /api/alerts      → list
 *   GET    /api/alerts/:id  → one alert
 *   POST   /api/alerts      → { signalId, channel, delivered? } (201, sentAt set by the server)
 *   PUT    /api/alerts/:id  → update fields, e.g. { delivered: true }
 *   DELETE /api/alerts/:id  → 204
 */
import { Router } from 'express'
import { alerts, signals, nextId, indexById, isMissing, ALERT_CHANNELS } from '../../data/athena.js'

const router = Router()
const REQUIRED = ['signalId', 'channel']
const NOT_FOUND = { error: 'Alert not found' }

// Checks the fields that are present; returns an error message or null
function invalidField ({ signalId, channel, delivered }) {
  if (signalId !== undefined && !signals.some((s) => s.id === signalId)) return 'Unknown signal'
  if (channel !== undefined && !ALERT_CHANNELS.includes(channel)) return `Channel must be one of ${ALERT_CHANNELS.join(', ')}`
  if (delivered !== undefined && typeof delivered !== 'boolean') return 'Delivered must be a boolean'
  return null
}

router.get('/api/alerts', (_req, res) => {
  res.status(200).json(alerts)
})

router.get('/api/alerts/:id', (req, res) => {
  const index = indexById(alerts, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)
  res.status(200).json(alerts[index])
})

router.post('/api/alerts', (req, res) => {
  const body = req.body
  if (REQUIRED.some((field) => isMissing(body[field]))) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const problem = invalidField(body)
  if (problem) return res.status(400).json({ error: problem })

  const alert = {
    id: nextId(alerts),
    signalId: body.signalId,
    channel: body.channel,
    sentAt: new Date().toISOString(),
    delivered: body.delivered ?? false
  }
  alerts.push(alert)
  res.status(201).json(alert)
})

router.put('/api/alerts/:id', (req, res) => {
  const index = indexById(alerts, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)

  const body = req.body
  if (REQUIRED.some((field) => field in body && isMissing(body[field]))) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const problem = invalidField(body)
  if (problem) return res.status(400).json({ error: problem })

  // Only these fields can change: id and sentAt stay as they are
  const updated = { ...alerts[index] }
  for (const field of ['signalId', 'channel', 'delivered']) {
    if (field in body) updated[field] = body[field]
  }
  alerts[index] = updated
  res.status(200).json(updated)
})

router.delete('/api/alerts/:id', (req, res) => {
  const index = indexById(alerts, req.params.id)
  if (index === -1) return res.status(404).json(NOT_FOUND)
  alerts.splice(index, 1)
  res.status(204).end()
})

export default router
