// Single source of truth for department names and employment-type/duration
// options on the CLIENT side. Mirrors server/config/constants.js — if you
// add/rename a department or duration here, update that file too.

export const DEPARTMENTS = [
  'Social Media',
  'Sales Development',
  'HR',
  'AI/ML Engineering',
  'Business Analyst',
  'Content Creator',
  'Full Stack ',
];

export const EMPLOYMENT_TYPES = ['Internship', 'Full-time'];

export const INTERNSHIP_DURATIONS = [3, 6, 9];