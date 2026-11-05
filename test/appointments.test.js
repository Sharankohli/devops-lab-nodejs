/**
 * Integration tests for /api/appointments.
 */
import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

const valid = { doctorId: 1, patientId: 2, date: '2026-12-15T09:30' }

describe('Appointments API', () => {
  it('GET /api/appointments returns an array of appointments', async () => {
    const res = await request(app).get('/api/appointments')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0]).toEqual(expect.objectContaining({ id: 1, doctorId: 1, patientId: 1 }))
  })

  it('POST /api/appointments creates an appointment with a new id', async () => {
    const res = await request(app).post('/api/appointments').send(valid)
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: expect.any(Number), ...valid })

    const list = await request(app).get('/api/appointments')
    expect(list.body).toContainEqual(res.body)
  })

  it.each(['doctorId', 'patientId', 'date'])('POST without %s returns 400', async (field) => {
    const body = { ...valid }
    delete body[field]
    const res = await request(app).post('/api/appointments').send(body)
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing required fields' })
  })

  it('POST with an invalid date returns 400', async () => {
    const res = await request(app).post('/api/appointments').send({ ...valid, date: 'next tuesday' })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid date' })
  })

  it('POST with an unknown doctor or patient returns 404', async () => {
    const noDoctor = await request(app).post('/api/appointments').send({ ...valid, doctorId: 999 })
    expect(noDoctor.status).toBe(404)
    expect(noDoctor.body).toEqual({ error: 'Doctor not found' })

    const noPatient = await request(app).post('/api/appointments').send({ ...valid, patientId: 999 })
    expect(noPatient.status).toBe(404)
    expect(noPatient.body).toEqual({ error: 'Patient not found' })
  })
})
