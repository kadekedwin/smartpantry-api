const express = require('express');

const db = require('../db');
const { nextId } = require('../utils/id');
const { ok, ApiError } = require('../utils/response');
const { requireFields } = require('../utils/validate');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const listAll = db.prepare(`
  SELECT id, name, quantity, unit, is_bought
  FROM shopping
  WHERE user_id = ?
  ORDER BY is_bought ASC, created_at DESC
`);
const findOne = db.prepare(`
  SELECT id, name, quantity, unit, is_bought
  FROM shopping
  WHERE id = ? AND user_id = ?
`);
const insertItem = db.prepare(`
  INSERT INTO shopping (id, user_id, name, quantity, unit)
  VALUES (@id, @user_id, @name, @quantity, @unit)
`);
const toggle = db.prepare(`
  UPDATE shopping
  SET is_bought = CASE is_bought WHEN 0 THEN 1 ELSE 0 END
  WHERE id = ? AND user_id = ?
`);

function serialize(row) {
  return { ...row, is_bought: !!row.is_bought };
}

router.get('/', authRequired, (req, res) => {
  const rows = listAll.all(req.user.id).map(serialize);
  return ok(res, rows, 'OK');
});

router.post('/', authRequired, (req, res, next) => {
  try {
    const body = req.body || {};
    requireFields(body, ['name', 'quantity', 'unit']);

    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(422, 'quantity must be a positive integer');
    }

    const item = {
      id: nextId('shop'),
      user_id: req.user.id,
      name: String(body.name),
      quantity,
      unit: String(body.unit),
    };
    insertItem.run(item);

    return ok(
      res,
      { id: item.id, name: item.name, quantity: item.quantity, unit: item.unit, is_bought: false },
      'Item added to shopping list',
      201
    );
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/toggle', authRequired, (req, res, next) => {
  try {
    const { id } = req.params;
    const info = toggle.run(id, req.user.id);
    if (info.changes === 0) throw new ApiError(404, 'Shopping item not found');
    const row = findOne.get(id, req.user.id);
    return ok(res, { id: row.id, is_bought: !!row.is_bought }, 'Updated');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
