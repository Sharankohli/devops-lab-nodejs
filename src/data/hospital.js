/**
 * In-memory hospital data shared by the /api routes.
 * There is no database in this lab: the arrays live as long as the server runs.
 */
export const doctors = [
  { id: 1, name: 'Dr. Sarah Lee', specialty: 'Cardiology' },
  { id: 2, name: 'Dr. Amir Khan', specialty: 'Pediatrics' }
]

export const patients = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'John', age: 45 }
]

export const appointments = [
  { id: 1, doctorId: 1, patientId: 1, date: '2026-12-01T10:00' }
]

// Next free id: one more than the highest id in the list (1 for an empty list)
export function nextId (list) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1
}
