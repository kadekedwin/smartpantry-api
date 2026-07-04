const db = require('../db');
const { nextId } = require('../utils/id');

const WARNING_DAYS = 3;
const LOW_STOCK_THRESHOLD = 1;

const listExpiringPerUser = db.prepare(`
  SELECT id, user_id, name, expired_at, stock
  FROM inventory
`);
const deleteExpiredItem = db.prepare('DELETE FROM inventory WHERE id = ?');

const insertNotification = db.prepare(`
  INSERT OR IGNORE INTO notifications (id, user_id, title, description, type, dedupe_key)
  VALUES (@id, @user_id, @title, @description, @type, @dedupe_key)
`);

function daysUntil(dateStr, today = new Date()) {
  const target = new Date(`${dateStr}T00:00:00Z`);
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return Math.round((target - start) / (1000 * 60 * 60 * 24));
}

function createNotification({ user_id, title, description, type, dedupe_key }) {
  insertNotification.run({
    id: nextId('notif'),
    user_id,
    title,
    description,
    type,
    dedupe_key,
  });
}

function runExpiryScan(now = new Date()) {
  const items = listExpiringPerUser.all();
  const today = now.toISOString().slice(0, 10);

  for (const item of items) {
    const days = daysUntil(item.expired_at, now);

    if (days < 0) {
      createNotification({
        user_id: item.user_id,
        title: 'Bahan Kadaluarsa',
        description: `${item.name} sudah kadaluarsa dan dihapus dari inventori`,
        type: 'expired',
        dedupe_key: `expired:${item.id}`,
      });
      deleteExpiredItem.run(item.id);
      continue;
    }

    if (days <= WARNING_DAYS) {
      createNotification({
        user_id: item.user_id,
        title: 'Segera Digunakan',
        description: `${item.name} akan kadaluarsa dalam ${days} hari lagi`,
        type: 'warning',
        dedupe_key: `warning:${item.id}:${today}`,
      });
    }

    if (item.stock <= LOW_STOCK_THRESHOLD) {
      createNotification({
        user_id: item.user_id,
        title: `Stok ${item.name} Menipis`,
        description: `Jangan lupa masukan ${item.name} ke daftar belanja`,
        type: 'stock',
        dedupe_key: `stock:${item.id}:${today}`,
      });
    }
  }
}

let intervalHandle = null;
function startScheduler(intervalMs = 24 * 60 * 60 * 1000) {
  if (intervalHandle) return;
  runExpiryScan();
  intervalHandle = setInterval(runExpiryScan, intervalMs);
  intervalHandle.unref?.();
}

function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = { runExpiryScan, startScheduler, stopScheduler };
