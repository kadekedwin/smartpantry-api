const fs = require('fs');
const path = require('path');

const express = require('express');

const db = require('../db');
const { nextId } = require('../utils/id');
const { ok, ApiError } = require('../utils/response');
const { requireFields, isIsoDate } = require('../utils/validate');
const { authRequired } = require('../middleware/auth');
const { imageUpload, uploadsDir, toPublicUrl } = require('../utils/uploads');

const router = express.Router();

const VALID_CATEGORIES = new Set(['kulkas', 'freezer', 'rak_dapur']);

const listAll = db.prepare(`
  SELECT id, name, image, stock, unit, expired_at, category
  FROM inventory
  WHERE user_id = ?
  ORDER BY expired_at ASC
`);
const listByCategory = db.prepare(`
  SELECT id, name, image, stock, unit, expired_at, category
  FROM inventory
  WHERE user_id = ? AND category = ?
  ORDER BY expired_at ASC
`);
const insertItem = db.prepare(`
  INSERT INTO inventory (id, user_id, name, image, stock, unit, expired_at, category)
  VALUES (@id, @user_id, @name, @image, @stock, @unit, @expired_at, @category)
`);

router.get('/', authRequired, (req, res) => {
  const { category } = req.query;
  if (category !== undefined && !VALID_CATEGORIES.has(category)) {
    throw new ApiError(400, 'Invalid category');
  }
  const rows = category
    ? listByCategory.all(req.user.id, category)
    : listAll.all(req.user.id);
  const withUrls = rows.map((r) => ({ ...r, image: toPublicUrl(req, r.image) }));
  return ok(res, withUrls, 'OK');
});

router.post('/', authRequired, imageUpload.single('image'), (req, res, next) => {
  const cleanupUpload = () => {
    if (req.file) {
      fs.unlink(path.join(uploadsDir, req.file.filename), () => {});
    }
  };
  try {
    const body = req.body || {};
    requireFields(body, ['name', 'stock', 'unit', 'expired_at', 'category']);
    if (!req.file) {
      throw new ApiError(422, 'image file is required');
    }

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
      image: `/uploads/${req.file.filename}`,
      stock,
      unit: String(body.unit),
      expired_at: body.expired_at,
      category: body.category,
    };
    insertItem.run(item);

    const { user_id, ...publicItem } = item;
    publicItem.image = toPublicUrl(req, publicItem.image);
    return ok(res, publicItem, 'Item added', 201);
  } catch (err) {
    cleanupUpload();
    next(err);
  }
});

module.exports = router;
