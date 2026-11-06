/**
 * /api/patients → view and add patients.
 *   GET  → list of patients { id, name, age }
 *   POST { name, age } → new patient with a generated id (201)
 */
import { Router } from 'express'
import { patients, nextId } from '../../data/hospital.js'

const router = Router()

// Absent, null or blank counts as missing
const isMissing = (value) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
const isValidName = (value) => typeof value === 'string'
const isValidAge = (value) => Number.isInteger(value) && value >= 0

router.get('/api/patients', (_req, res) => {
  res.status(200).json(patients)
})

router.post('/api/patients', (req, res) => {
  const { name, age } = req.body
  if (isMissing(name) || isMissing(age)) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  if (!isValidName(name) || !isValidAge(age)) {
    return res.status(400).json({
      error: 'Name must be non-blank and age must be a non-negative integer'
    })
  }

  const patient = {
    id: nextId(patients),
    name: name.trim(),
    age
  }
  patients.push(patient)
  res.status(201).json(patient)
})

export default router
