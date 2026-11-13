import express from 'express';
import cors from 'cors';
import sequelize from './database';
import orderRoutes from './routes/order.routes';

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = process.env.FRONTEND_URL
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && !allowedOrigins?.length) {
  throw new Error('FRONTEND_URL debe configurarse en producción.');
}

app.use(cors({
  origin: allowedOrigins?.length ? allowedOrigins : 'http://localhost:5173',
}));
app.use(express.json());
app.use('/api/orders', orderRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    await sequelize.sync();
    console.log('Database synchronized.');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}.`);
    });
  } catch (error) {
    console.error('Unable to connect to the database.', error);
    process.exitCode = 1;
  }
};

startServer();
