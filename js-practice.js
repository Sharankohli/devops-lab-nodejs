/**
 * Lab 5 – JavaScript practice (run with: node js-practice.js)
 * Healthcare examples reused later by the /api routes.
 */

// ---------- 2.1 Variables and data types ----------
console.log('\n=== 2.1 Variables and data types ===')
const hospitalName = 'Central Hospital'
const numberOfDoctors = 12
let isOpen = true

function openingMessage () {
  return isOpen
    ? `Welcome to ${hospitalName}! We have ${numberOfDoctors} doctors currently available.`
    : `${hospitalName} is closed right now. Please come back tomorrow.`
}
console.log(openingMessage())
isOpen = false
console.log(openingMessage())

// ---------- 2.2 Arrays and loops ----------
console.log('\n=== 2.2 Arrays and loops ===')
const doctors = ['Dr. Lee', 'Dr. Khan', 'Dr. Martin', 'Dr. Dubois', 'Dr. Rossi']

for (const [index, name] of doctors.entries()) {
  console.log(`Doctor #${index + 1}: ${name}`)
}

doctors.push('Dr. Garcia')
console.log(`Number of doctors after push(): ${doctors.length}`)

function findDoctor (name) {
  return doctors.includes(name) ? 'Doctor found' : 'Doctor not found'
}
console.log('findDoctor("Dr. Khan") →', findDoctor('Dr. Khan'))
console.log('findDoctor("Dr. House") →', findDoctor('Dr. House'))

// ---------- 2.3 Objects and nested data ----------
console.log('\n=== 2.3 Objects and nested data ===')
const patient = {
  name: 'Alice Martin',
  age: 34,
  conditions: ['diabetes', 'hypertension'],
  doctor: { name: 'Dr. Lee', specialty: 'Cardiology' }
}

console.log('Doctor name:', patient.doctor.name)
console.log('Number of conditions:', patient.conditions.length)
console.log(`${patient.name} is treated by ${patient.doctor.name} (${patient.doctor.specialty}).`)

patient.conditions.push('anxiety')
console.log('Updated patient:', patient)

// ---------- 2.4 Functions and array filtering ----------
console.log('\n=== 2.4 Functions and array filtering ===')
const patients = [
  { id: 1, name: 'Alice', age: 34 },
  { id: 2, name: 'John', age: 45 },
  { id: 3, name: 'Marie', age: 29 }
]

const filterByAge = (minAge) => patients.filter((p) => p.age > minAge)

function addPatient (name, age) {
  const newPatient = { id: patients.length + 1, name, age }
  patients.push(newPatient)
  return newPatient
}

console.log('Patients older than 30:', filterByAge(30))
console.log('Added:', addPatient('Paul', 52))
console.log('Updated list:', patients)

// ---------- 2.6 Error handling and validation ----------
console.log('\n=== 2.6 Error handling and validation ===')
function createAppointment (doctor, patient, date) {
  if (!doctor || !patient || !date) {
    throw new Error('Missing required fields')
  }
  return { doctor, patient, date }
}

try {
  console.log(createAppointment('Dr. Lee', 'Alice', '2026-03-15'))
  console.log(createAppointment('Dr. Lee')) // should trigger the error
} catch (err) {
  console.error('Error:', err.message)
}

// ---------- 2.7 Asynchronous code ----------
console.log('\n=== 2.7 Asynchronous code ===')
function getHospitalData () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ name: hospitalName, uptime: 1234 })
    }, 1000)
  })
}

async function showData () {
  console.log('Fetching hospital data...')
  const data = await getHospitalData()
  console.log('Data loaded:', data)
}

showData()
