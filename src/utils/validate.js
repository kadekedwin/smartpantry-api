const { ApiError } = require('./response');

function requireFields(body, fields) {
  const errors = [];
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      errors.push(`${f} is required`);
    }
  }
  if (errors.length) throw new ApiError(422, errors.join(', '));
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isIsoDate(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str) && !Number.isNaN(Date.parse(str));
}

module.exports = { requireFields, isValidEmail, isIsoDate };
