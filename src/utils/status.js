/**
 * Utility designed to create branch coverage.
 * Maps uptime (seconds) to a label.
 */
export function formatStatus (uptimeSec) {
  // Reject non-numbers too: 'abc' < 60 is false, so they used to fall through to 'steady'
  if (!Number.isFinite(uptimeSec) || uptimeSec < 0) throw new Error('invalid uptime')
  if (uptimeSec < 60) return 'warming-up'
  if (uptimeSec < 3600) return 'healthy'
  return 'steady'
}
