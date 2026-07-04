const express = require('express');

const db = require('../db');
const { ok } = require('../utils/response');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const listAll = db.prepare(`
  SELECT id, title, description, type, created_at
  FROM notifications
  WHERE user_id = ?
  ORDER BY created_at DESC
`);

router.get('/', authRequired, (req, res) => {
  return ok(res, listAll.all(req.user.id), 'OK');
});

module.exports = router;
