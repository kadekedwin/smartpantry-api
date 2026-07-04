const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'data', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
    }
    cb(null, true);
  },
});

function toPublicUrl(req, storedPath) {
  if (!storedPath) return storedPath;
  if (/^https?:\/\//i.test(storedPath)) return storedPath;
  if (!storedPath.startsWith('/')) return storedPath;
  return `${req.protocol}://${req.get('host')}${storedPath}`;
}

module.exports = { uploadsDir, imageUpload, toPublicUrl };
