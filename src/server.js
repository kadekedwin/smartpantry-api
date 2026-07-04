require('dotenv').config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev-secret-change-me';
  console.warn('[warn] JWT_SECRET not set — using insecure default (dev only)');
}

const app = require('./app');
const { startScheduler } = require('./jobs/notifications');

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Smart Pantry API listening on http://localhost:${port}`);
  startScheduler();
});
