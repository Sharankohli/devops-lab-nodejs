/**
 * GET /api/metrics → system and hospital statistics.
 *   system:   uptime (s), status label, Node version, memory used (MB)
 *   hospital: number of doctors, patients and appointments
 */
import { Router } from 'express'
import { doctors, patients, appointments } from '../../data/hospital.js'
import { formatStatus } from '../../utils/status.js'

const router = Router()

router.get('/api/metrics', (_req, res) => {
  const uptime = process.uptime()
  res.status(200).json({
    system: {
      uptime,
      status: formatStatus(uptime),
      node: process.version,
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    hospital: {
      doctors: doctors.length,
      patients: patients.length,
      appointments: appointments.length
    }
  })
})

export default router
