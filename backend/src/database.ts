import { Sequelize } from 'sequelize';
import dotenv from 'dotenv'

//carga las variables del entorno desde un archivo .env si lo hubiera
dotenv.config();

//creamos la instancia de sequelize para conectarnos con PostgreSQL
const sequelize = new Sequelize ('pastelitos_db', 'postgres','password123', {
host: 'localhost',    
port: 5433,
dialect: 'postgres',
logging: false //evitamos q la terminal se llene de logs inecesarios de sql
});
export default sequelize;
