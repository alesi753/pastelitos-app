import express from 'express';
import cors from 'cors';
import sequelize from './database';
import orderRoutes from './routes/order.routes';

const app = express();
const port = process.env.PORT || 3000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL debe configurarse en producción.');
}

app.use(cors({
  origin: frontendUrl,
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
