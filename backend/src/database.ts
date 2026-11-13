import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({
  path: [resolve(__dirname, '../../.env'), resolve(__dirname, '../.env')],
});

const dialectOptions = {
  ssl: process.env.NODE_ENV === 'production' ? { require: true } : false,
};

const requiredDatabaseSetting = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured to connect to PostgreSQL.`);
  }
  return value;
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions,
    })
  : new Sequelize({
      database: requiredDatabaseSetting('DB_NAME'),
      username: requiredDatabaseSetting('DB_USER'),
      password: requiredDatabaseSetting('DB_PASSWORD'),
      host: requiredDatabaseSetting('DB_HOST'),
      port: Number(process.env.DB_PORT || 5433),
      dialect: 'postgres',
      logging: false,
      dialectOptions,
    });

export default sequelize;