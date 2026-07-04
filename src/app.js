const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const inventoryRoutes = require('./routes/inventory');
const shoppingRoutes = require('./routes/shopping');
const notificationsRoutes = require('./routes/notifications');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/health', (req, res) => res.json({ data: { status: 'ok' }, message: 'OK' }));

const v1 = express.Router();
v1.use('/auth', authRoutes);
v1.use('/profile', profileRoutes);
v1.use('/inventory', inventoryRoutes);
v1.use('/shopping', shoppingRoutes);
v1.use('/notifications', notificationsRoutes);

app.use('/v1', v1);
app.use(v1);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
