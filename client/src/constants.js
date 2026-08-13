// Mirrors server/utils/constants.js. Keep these two lists in sync.
export const DEPARTMENTS = [
  'Social Media',
  'Sales Development',
  'HR',
  'AI/ML Engineering',
  'Business Analyst',
  'Content Creator',
  'Full Stack',
];

export const EMPLOYMENT_TYPES = ['Internship', 'Full-time'];

export const INTERNSHIP_DURATIONS = [3, 6, 9]; // months

// Adds N months to a YYYY-MM-DD date string and returns a YYYY-MM-DD string,
// for live preview only - the backend recomputes and is the source of truth.
export const addMonthsToDateString = (dateString, months) => {
  if (!dateString || !months) return '';
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + Number(months));
  return date.toISOString().split('T')[0];
};