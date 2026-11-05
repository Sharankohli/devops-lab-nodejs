/**
 * Integration tests for GET /api/metrics.
 */
import request from 'supertest'
import app from '../src/app.js'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { doctors, patients, appointments } from '../src/data/hospital.js'

afterEach(() => vi.restoreAllMocks())

describe('GET /api/metrics', () => {
  it('returns system and hospital stats as JSON', async () => {
    const res = await request(app).get('/api/metrics')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body).toEqual({
      system: {
        uptime: expect.any(Number),
        status: expect.stringMatching(/^(warming-up|healthy|steady)$/),
        node: process.version,
        memoryMB: expect.any(Number)
      },
      hospital: {
        doctors: doctors.length,
        patients: patients.length,
        appointments: appointments.length
      }
    })
  })

  it('labels the status from the uptime', async () => {
    vi.spyOn(process, 'uptime').mockReturnValue(3600)
    const res = await request(app).get('/api/metrics')
    expect(res.body.system).toEqual(expect.objectContaining({ uptime: 3600, status: 'steady' }))
  })

  it('counts follow the data: a new appointment increases the count', async () => {
    const before = (await request(app).get('/api/metrics')).body.hospital.appointments
    const created = await request(app).post('/api/appointments')
      .send({ doctorId: 2, patientId: 1, date: '2026-12-20T14:00' })
    expect(created.status).toBe(201)

    const after = (await request(app).get('/api/metrics')).body.hospital
    expect(after.appointments).toBe(before + 1)
    expect(after.doctors).toBe(doctors.length)
    expect(after.patients).toBe(patients.length)
  })
})
