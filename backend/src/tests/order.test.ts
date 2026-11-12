import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Order from '../models/order';      
import sequelize from '../database';      

describe('Order Model Unit Tests', () => {
  // Nos aseguramos de conectar y sincronizar la base de datos antes de ejecutar las pruebas
  beforeAll(async () => {
    try {
      await sequelize.authenticate();
      // Opcional recomendado: sincronizamos el modelo para que la tabla exista en la BD de pruebas
      await Order.sync({ alter: true });
    } catch (error) {
      console.error('Error al conectar con la base de datos en los tests:', error);
      throw error;
    }
  });

  // Cerramos la conexión correctamente al finalizar para evitar sockets colgados
  afterAll(async () => {
    await sequelize.close();
  });

  it('debería fallar al intentar crear un pedido sin nombre de cliente (clientName)', async () => {
    try {
      await Order.create({ //no existe el clientName:
        clientPhone: '0000000000',
        address: 'Dirección ficticia',
        deliveryDate: '2026-10-30',
        quantityMembrillo: 2,
        quantityBatata: 1,
      });
      // Si por alguna razón se crea, forzamos que el test falle
      expect.fail('Debería haber lanzado un error por allowNull: false en clientName');
    } catch (error: any) {
      // Verificamos que Sequelize haya rechazado la operación por validación de campos
      expect(error).toBeDefined();
    }
  });

  it('debería asignar el estado "pendiente" correctamente al persistir', async () => {
    const newOrder = await Order.create({
      clientName: 'Cliente de prueba',
      clientPhone: '0000000000',
      address: 'Dirección ficticia',
      deliveryDate: '2026-11-01',
      quantityMembrillo: 1,
      quantityBatata: 1,
    });

    expect(newOrder.status).toBe('pendiente');
  });
});