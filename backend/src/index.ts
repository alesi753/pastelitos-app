import express from 'express';
import sequelize from './database'; 
import order from './models/order';
import orderRoutes from './routes/order.routes';

const app= express(); //inicializamos la app de express
const PORT = process.env.PORT || 3000

app.use (express.json()); //Middleware obligatorio para que el servidor pueda leer y entender JSON en las peticiones HTTP

// Función asíncrona para conectar a la base de datos, sincronizar la tabla y encender el servidor
const startServer = async () => {
    try{
        await sequelize.authenticate(); //chequeamos que la coneccion con postgre sql responda correctamente
        console.log('Connection has been established successfully.');
        
        await sequelize.sync({alter: true}); //Sincronizamos los modelos con la base de datos (crea la tabla 'orders' automáticamente si no existe)
            console.log('Database synchronized successfully')
        
        
        app.listen (PORT,()=>{ //Si todo lo anterior sale bien, ponemos a escuchar el servidor
            console.log('Server is running on http://localhost:${PORT}');
        });

    } catch(error){ // Si algo falla, mostramos el error
        console.error('Unable to connect to the database',error);

    }
    

};
app.use('/api/orders', orderRoutes);
startServer(); //ejecutamos la funcion de arranque
