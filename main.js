/**
 * Lab 5 – 2.5 Modularization: imports the module and calls its functions.
 * Run with: node main.js
 */
import { doctors, patients, addDoctor, addPatient } from './hospitalData.js'

addDoctor('Dr. Martin')
console.log('Updated doctors:', doctors)

addPatient('Marie', 29)
console.log('Updated patients:', patients)
