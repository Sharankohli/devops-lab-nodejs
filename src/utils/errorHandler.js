/**
 * Centralized Express error handling.
 *  - errors created on purpose carry a status (e.g. /boom, invalid JSON body → 400):
 *    they keep their status and message
 *  - anything else is unexpected: it is logged and answered with a generic 500
 */
export function errorHandler (err, _req, res, _next) {
  const status = err?.status ?? err?.statusCode
  if (status) {
    return res.status(status).json({ error: true, message: err.message ?? 'Error' })
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}

// Requests that no route answered
export function notFound (_req, res) {
  res.status(404).json({ error: 'Not found' })
}
