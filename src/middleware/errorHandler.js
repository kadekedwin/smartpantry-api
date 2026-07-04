const multer = require('multer');

const { ApiError } = require('../utils/response');

function notFound(req, res) {
  res.status(404).json({ data: null, message: 'Not Found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ data: null, message: err.message });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'image file too large (max 5MB)'
      : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'image must be a PNG, JPEG, WEBP, or GIF file uploaded as the "image" field'
        : `upload error: ${err.message}`;
    return res.status(422).json({ data: null, message });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ data: null, message: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ data: null, message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
