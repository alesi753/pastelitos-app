import sequelize from '../database';
import Order from '../models/order';

const dateInDays = (daysFromToday: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const demoOrders = [
  {
    clientName: 'Cliente de prueba 01',
    clientPhone: '0000000000',
    address: 'Dirección ficticia 01',
    latitude: null,
    longitude: null,
    quantityMembrillo: 2,
    quantityBatata: 1,
    deliveryDate: dateInDays(1),
    status: 'pendiente',
  },
  {
    clientName: 'Cliente de prueba 02',
    clientPhone: '0000000000',
    address: 'Dirección ficticia 02',
    latitude: null,
    longitude: null,
    quantityMembrillo: 1,
    quantityBatata: 2,
    deliveryDate: dateInDays(1),
    status: 'pendiente',
  },
  {
    clientName: 'Cliente de prueba 03',
    clientPhone: '0000000000',
    address: 'Dirección ficticia 03',
    latitude: null,
    longitude: null,
    quantityMembrillo: 3,
    quantityBatata: 0,
    deliveryDate: dateInDays(2),
    status: 'pendiente',
  },
  {
    clientName: 'Cliente de prueba 04',
    clientPhone: '0000000000',
    address: 'Dirección ficticia 04',
    latitude: null,
    longitude: null,
    quantityMembrillo: 0,
    quantityBatata: 4,
    deliveryDate: dateInDays(2),
    status: 'pendiente',
  },
];

const seedDemoOrders = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existingOrders = await Order.count();
    if (existingOrders > 0) {
      throw new Error(
        `La base ya contiene ${existingOrders} pedidos. No se agregaron datos de demostración.`,
      );
    }

    await Order.bulkCreate(demoOrders);
    console.log(`Se cargaron ${demoOrders.length} pedidos ficticios.`);
  } finally {
    await sequelize.close();
  }
};

seedDemoOrders().catch((error: unknown) => {
  console.error('No se pudieron cargar los pedidos de demostración.', error);
  process.exitCode = 1;
});
