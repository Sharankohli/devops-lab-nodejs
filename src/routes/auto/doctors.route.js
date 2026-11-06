/**
 * /api/doctors → hospital doctor list, shared with other services.
 *   GET  → list of doctors { id, name, specialty }
 *   POST { name, specialty } → new doctor with a generated id (201)
 */
import { Router } from 'express'
import { doctors, nextId } from '../../data/hospital.js'

const router = Router()

// A field counts as present only if it is a non-blank string
const isFilled = (value) => typeof value === 'string' && value.trim() !== ''

router.get('/api/doctors', (_req, res) => {
  res.status(200).json(doctors)
})

router.post('/api/doctors', (req, res) => {
  const { name, specialty } = req.body
  if (!isFilled(name) || !isFilled(specialty)) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const doctor = {
    id: nextId(doctors),
    name: name.trim(),
    specialty: specialty.trim()
  }
  doctors.push(doctor)
  res.status(201).json(doctor)
})

export default router
