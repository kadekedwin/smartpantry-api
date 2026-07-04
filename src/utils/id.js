const db = require('../db');

const bumpStmt = db.prepare(`
  INSERT INTO id_counters (prefix, value) VALUES (?, 1)
  ON CONFLICT(prefix) DO UPDATE SET value = value + 1
  RETURNING value
`);

function nextId(prefix) {
  const { value } = bumpStmt.get(prefix);
  return `${prefix}_${String(value).padStart(2, '0')}`;
}

module.exports = { nextId };
