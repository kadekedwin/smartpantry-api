const express = require('express');

const db = require('../db');
const { nextId } = require('../utils/id');
const { ok, ApiError } = require('../utils/response');
const { requireFields, isIsoDate } = require('../utils/validate');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = new Set(['kulkas', 'freezer', 'rak_dapur']);

const listAll = db.prepare(`
  SELECT id, name, icon, stock, unit, expired_at, category
  FROM inventory
  WHERE user_id = ?
  ORDER BY expired_at ASC
`);
const listByCategory = db.prepare(`
  SELECT id, name, icon, stock, unit, expired_at, category
  FROM inventory
  WHERE user_id = ? AND category = ?
  ORDER BY expired_at ASC
`);
const insertItem = db.prepare(`
  INSERT INTO inventory (id, user_id, name, icon, stock, unit, expired_at, category)
  VALUES (@id, @user_id, @name, @icon, @stock, @unit, @expired_at, @category)
`);

router.get('/', authRequired, (req, res) => {
  const { category } = req.query;
  if (category !== undefined && !VALID_CATEGORIES.has(category)) {
    throw new ApiError(400, 'Invalid category');
  }
  const rows = category
    ? listByCategory.all(req.user.id, category)
    : listAll.all(req.user.id);
  return ok(res, rows, 'OK');
});

router.post('/', authRequired, (req, res, next) => {
  try {
    const body = req.body || {};
    requireFields(body, ['name', 'icon', 'stock', 'unit', 'expired_at', 'category']);

    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock <= 0) {
      throw new ApiError(422, 'stock must be a positive integer');
    }
    if (!isIsoDate(body.expired_at)) {
      throw new ApiError(422, 'expired_at must be YYYY-MM-DD');
    }
    if (!VALID_CATEGORIES.has(body.category)) {
      throw new ApiError(422, 'category must be kulkas, freezer, or rak_dapur');
    }

    const item = {
      id: nextId('inv'),
      user_id: req.user.id,
      name: String(body.name),
      icon: String(body.icon),
      stock,
      unit: String(body.unit),
      expired_at: body.expired_at,
      category: body.category,
    };
    insertItem.run(item);

    const { user_id, ...publicItem } = item;
    return ok(res, publicItem, 'Item added', 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
