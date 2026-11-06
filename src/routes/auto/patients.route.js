import { Router } from 'express'
import { patients, nextId } from '../../data/hospital.js'

const router = Router()

// A field counts as present only if it is a non-blank string
const isFilled = (value) => typeof value === 'string' && value.trim() !== ''
const isIntFilled = (value) => Number.isInteger(value) && value >= 0

router.get('/api/patients', (_req, res) => {
  res.status(200).json(patients)
})

router.post('/api/patients', (req, res) => {
  const { name, age } = req.body
  if (!isFilled(name) || !isIntFilled(age)) {
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
