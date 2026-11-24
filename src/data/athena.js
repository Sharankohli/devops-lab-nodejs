/**
 * In-memory data for the Athena API (entities from the SDD, section 4.1).
 * No database in the lab: the arrays live as long as the server runs.
 */
export { nextId } from './hospital.js'

export const DIRECTIONS = ['bullish', 'bearish']
export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '1D']
export const RESULTS = ['correct', 'incorrect']
export const ALERT_CHANNELS = ['push', 'email', 'in-app']
export const WATCHLIST_MAX = 10

export const tickers = [
  { id: 1, symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { id: 2, symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ' },
  { id: 3, symbol: 'BTC-USD', name: 'Bitcoin', exchange: 'CRYPTO' }
]

export const signals = [
  { id: 1, ticker: 'AAPL', direction: 'bullish', confidence: 82, reasoning: 'Earnings beat and rising volume', timeframe: '1h', firedAt: '2026-11-20T14:30:00.000Z', result: 'correct' },
  { id: 2, ticker: 'TSLA', direction: 'bearish', confidence: 64, reasoning: 'Lower deliveries guidance', timeframe: '1D', firedAt: '2026-11-21T09:00:00.000Z', result: null }
]

export const watchlist = [
  { id: 1, ticker: 'AAPL', addedAt: '2026-11-20T08:00:00.000Z', alertEnabled: true, alertChannel: 'push' }
]

export const alerts = [
  { id: 1, signalId: 1, channel: 'push', sentAt: '2026-11-20T14:30:05.000Z', delivered: true }
]

// Index of the item whose id equals the :id route parameter (-1 if none)
export function indexById (list, id) {
  return list.findIndex((item) => item.id === Number(id))
}

// True if the symbol belongs to a known ticker (case does not matter)
export function isKnownTicker (symbol) {
  return typeof symbol === 'string' && tickers.some((t) => t.symbol === symbol.toUpperCase())
}

// Absent, null or blank counts as missing
export function isMissing (value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
}
