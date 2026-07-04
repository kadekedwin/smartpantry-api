const express = require('express');
const { authRequired } = require('../middleware/auth');
const { ok } = require('../utils/response');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const { id, name, email, avatar_url } = req.user;
  return ok(res, { id, name, email, avatar_url }, 'OK');
});

module.exports = router;
