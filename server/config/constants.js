// Single source of truth for department names and employment-type/duration
// options on the SERVER side. Mirrors client/src/constants/departments.js —
// if you add/rename a department or duration here, update that file too.

const DEPARTMENTS = [
  'Social Media',
  'Sales Development',
  'HR',
  'AI/ML Engineering',
  'Business Analyst',
  'Content Creator',
  'Full Stack',
];

const EMPLOYMENT_TYPES = ['Internship', 'Full-time'];

// Allowed internship durations, in months. Only relevant when
// employmentType === 'Internship'.
const INTERNSHIP_DURATIONS = [3, 6, 9];

module.exports = { DEPARTMENTS, EMPLOYMENT_TYPES, INTERNSHIP_DURATIONS };