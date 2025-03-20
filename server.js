const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: 'config.env' });

// Inicializar la aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para CORS
app.use(cors({
  origin: ['http://localhost:4200', 'https://lov.com.co'],
  methods: 'GET,POST,PUT',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json());




// Importar routers
const authService = require('./routes/authService');
const customersRouter = require('./routes/customers');
const networkRouter = require('./routes/network');
const authenticationRouter = require('./routes/authentication');
const portabilityRouter = require('./routes/portability');
const blockDeviceRouter = require('./routes/blockDevice');
const blockSimRouter = require('./routes/blockSim');
const queryImeiRouter = require('./routes/queryImei');
const troubleTicketCategoriesRouter = require('./routes/troubleTicketCategories');
const createTroubleTicketRouter = require('./routes/createTroubleTicket');
const getTickedByMsisdn = require('./routes/getTickedByMsisdn');

// Usar routers en la ruta base /api-dtv
app.use('/api-dtv', customersRouter);
app.use('/api-dtv', networkRouter);
app.use('/api-dtv', authenticationRouter);
app.use('/api-dtv', portabilityRouter);
app.use('/api-dtv', blockDeviceRouter);
app.use('/api-dtv', blockSimRouter);
app.use('/api-dtv', queryImeiRouter);
app.use('/api-dtv', troubleTicketCategoriesRouter);
app.use('/api-dtv', createTroubleTicketRouter);
app.use('/api-dtv', getTickedByMsisdn);

// Rutas públicas
app.use('/api-dtv', authService);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
