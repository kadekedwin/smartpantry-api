const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const db = require('../db');
const { nextId } = require('../utils/id');
const { ok, fail, ApiError } = require('../utils/response');
const { requireFields, isValidEmail } = require('../utils/validate');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const findByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const insertUser = db.prepare(`
  INSERT INTO users (id, name, email, password_hash, avatar_url)
  VALUES (@id, @name, @email, @password_hash, @avatar_url)
`);
const revokeToken = db.prepare(`
  INSERT OR IGNORE INTO revoked_tokens (jti, user_id, expires_at)
  VALUES (?, ?, ?)
`);

function signToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user.id, email: user.email, jti },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return { token, jti };
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, avatar_url: u.avatar_url };
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    requireFields(req.body || {}, ['name', 'email', 'password']);
    if (!isValidEmail(email)) throw new ApiError(422, 'Invalid email');
    if (String(password).length < 6) throw new ApiError(422, 'Password must be at least 6 characters');

    if (findByEmail.get(email)) {
      throw new ApiError(422, 'Email already registered');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = {
      id: nextId('usr'),
      name,
      email,
      password_hash,
      avatar_url: null,
    };
    insertUser.run(user);

    const { token } = signToken(user);
    return ok(res, { token, user: publicUser(user) }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    requireFields(req.body || {}, ['email', 'password']);

    const user = findByEmail.get(email);
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const matched = await bcrypt.compare(password, user.password_hash);
    if (!matched) throw new ApiError(401, 'Invalid credentials');

    const { token } = signToken(user);
    return ok(res, { token, user: publicUser(user) }, 'Login successful', 200);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authRequired, (req, res) => {
  const { jti, exp } = req.token || {};
  if (jti && exp) {
    revokeToken.run(jti, req.user.id, new Date(exp * 1000).toISOString());
  }
  return ok(res, null, 'Logged out', 200);
});

module.exports = router;
