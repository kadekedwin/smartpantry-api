const jwt = require('jsonwebtoken');
const db = require('../db');
const { fail } = require('../utils/response');

const isRevoked = db.prepare('SELECT 1 FROM revoked_tokens WHERE jti = ?');
const findUser = db.prepare('SELECT id, name, email, avatar_url FROM users WHERE id = ?');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return fail(res, 'Unauthorized', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return fail(res, 'Unauthorized', 401);
  }

  if (payload.jti && isRevoked.get(payload.jti)) {
    return fail(res, 'Unauthorized', 401);
  }

  const user = findUser.get(payload.sub);
  if (!user) {
    return fail(res, 'Unauthorized', 401);
  }

  req.user = user;
  req.token = { jti: payload.jti, exp: payload.exp };
  next();
}

module.exports = { authRequired };
