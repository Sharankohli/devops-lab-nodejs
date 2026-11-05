/**
 * /api/appointments → schedule visits between a doctor and a patient.
 *   GET  → list of appointments
 *   POST { doctorId, patientId, date } → new appointment (201)
 */
import { Router } from 'express'
import { appointments, doctors, patients, nextId } from '../../data/hospital.js'

const router = Router()

router.get('/api/appointments', (_req, res) => {
  res.status(200).json(appointments)
})

router.post('/api/appointments', (req, res) => {
  const { doctorId, patientId, date } = req.body
  if (!doctorId || !patientId || !date) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  if (Number.isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Invalid date' })
  }
  if (!doctors.some((d) => d.id === Number(doctorId))) {
    return res.status(404).json({ error: 'Doctor not found' })
  }
  if (!patients.some((p) => p.id === Number(patientId))) {
    return res.status(404).json({ error: 'Patient not found' })
  }

  const appointment = {
    id: nextId(appointments),
    doctorId: Number(doctorId),
    patientId: Number(patientId),
    date
  }
  appointments.push(appointment)
  res.status(201).json(appointment)
})

export default router
