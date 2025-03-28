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

<<<<<<< HEAD
// Iniciar el servidor
=======
// Endpoint para solicitud de portabilidad (portInRequest)
app.put('/api-dtv/portInRequest', async (req, res) => {
    try {
        const {
            subscriberId,
            authCode,
            donorOperator,
            recipientOperator,
            requestedFutureDate,
            subscriberType,
            transparentData,
            newMsisdn
        } = req.body;
  
        // Validaciones básicas
        if (!subscriberId) {
            return res.status(400).json({ message: "El subscriberId es obligatorio" });
        }
        if (!newMsisdn) {
            return res.status(400).json({ message: "El newMsisdn es obligatorio" });
        }
        // Validar subscriberType: solo NATURAL o COMPANY
        if (subscriberType !== "NATURAL" && subscriberType !== "COMPANY") {
            return res.status(400).json({ message: "subscriberType debe ser NATURAL o COMPANY" });
        }
        // Validar transparentData.subscriberIdentityType
        if (!transparentData || !transparentData.subscriberIdentityType) {
            return res.status(400).json({ message: "transparentData.subscriberIdentityType es obligatorio" });
        }
        const allowedIdTypes = ["ID", "NIT", "FOREIGN_ID", "PASSPORT"];
        if (allowedIdTypes.indexOf(transparentData.subscriberIdentityType) === -1) {
            return res.status(400).json({ message: "subscriberIdentityType debe ser ID, NIT, FOREIGN_ID o PASSPORT" });
        }
        // Validar transparentData.subscriberServiceType
        if (!transparentData || !transparentData.subscriberServiceType) {
            return res.status(400).json({ message: "transparentData.subscriberServiceType es obligatorio" });
        }
        const allowedServiceTypes = ["PREPAID", "POSTPAID"];
        if (allowedServiceTypes.indexOf(transparentData.subscriberServiceType) === -1) {
            return res.status(400).json({ message: "subscriberServiceType debe ser PREPAID o POSTPAID" });
        }
  
        // Formatear requestedFutureDate a ISO (por ejemplo, "2025-02-22T22:29:23.043Z")
        let formattedRequestedFutureDate;
        const futureDateObj = new Date(requestedFutureDate);
        if (isNaN(futureDateObj.getTime())) {
            return res.status(400).json({ message: "requestedFutureDate no es una fecha válida" });
        }
        formattedRequestedFutureDate = futureDateObj.toISOString();
  
        // Formatear transparentData.subscriberIdentityIssue a "YYYY/MM/DD"
        let formattedIdentityIssue;
        const identityIssueObj = new Date(transparentData.subscriberIdentityIssue);
        if (isNaN(identityIssueObj.getTime())) {
            return res.status(400).json({ message: "transparentData.subscriberIdentityIssue no es una fecha válida" });
        }
        const year = identityIssueObj.getFullYear();
        const month = ('0' + (identityIssueObj.getMonth() + 1)).slice(-2);
        const day = ('0' + identityIssueObj.getDate()).slice(-2);
        formattedIdentityIssue = `${year}/${month}/${day}`;
        transparentData.subscriberIdentityIssue = formattedIdentityIssue;
  
        // Construir el objeto que se enviará al backend remoto
        const requestBody = {
            authCode: authCode, // El NIP se envía tal cual
            donorOperator: donorOperator,
            newMsisdn: newMsisdn,
            recipientOperator: recipientOperator,
            requestedFutureDate: formattedRequestedFutureDate,
            subscriberType: subscriberType,
            transparentData: transparentData
        };
  
        const response = await axios.put(
            `${process.env.BACKEND_URL}/rest/v6.1/mnp/portin/subscriptions/${subscriberId}`,
            requestBody,
            {
                headers: {
                    'accept': 'application/json',
                    'accessKey': process.env.ACCESS_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
  
        res.json(response.data);
    } catch (error) {
        const statusCode = (error.response && error.response.status) ? error.response.status : 500;
        console.error("Error en portInRequest:", error.response && error.response.data ? error.response.data : error.message);
        res.status(statusCode).json({
            message: 'Error al procesar la solicitud de portabilidad',
            error: error.response && error.response.data ? error.response.data : error.message
        });
    }
});
  
// Endpoint para bloquear un dispositivo por IMEI
app.put('/api-dtv/blockDeviceByImei', async (req, res) => {
    try {
        const { phoneNumber, imei, eventDate, reportDate, reportType, reporter, reporterDocument, victimEmail, victimMinor, violenceApplied, weaponApplied } = req.body;
  
        if (!phoneNumber || !imei || !eventDate || !reportDate || !reportType || !reporter || !reporterDocument || !victimEmail || victimMinor === undefined || violenceApplied === undefined) {
            return res.status(400).json({ message: "Todos los campos obligatorios deben ser proporcionados" });
        }
  
        const { address, city, name, phone, state } = reporter;
        if (!address || !city || !name || !phone || !state) {
            return res.status(400).json({ message: "Todos los campos dentro de 'reporter' son obligatorios" });
        }
  
        const customerResponse = await axios.get(`${process.env.BACKEND_URL}/rest/v6.1/customersBySubscription`, {
            params: { msisdn: phoneNumber },
            headers: {
                'accept': 'application/json',
                'accessKey': process.env.ACCESS_KEY
            }
        });
  
        const subscriptions = customerResponse.data.payload && customerResponse.data.payload.subscriptions ? customerResponse.data.payload.subscriptions : [];
        const subscriptionId = (subscriptions.length > 0 && subscriptions[0].id) ? subscriptions[0].id : null;
        
        if (!subscriptionId) {
            return res.status(400).json({ message: "No se pudo obtener el subscriptionId" });
        }
  
        const requestBody = {
            eventDate,
            habeasData: true,
            imei,
            reportDate,
            reportType,
            reporter,
            reporterDocument,
            victimEmail,
            victimMinor,
            violenceApplied
        };
  
        if (violenceApplied) {
            requestBody.weaponApplied = weaponApplied;
        } else {
            requestBody.weaponApplied = null;
        }
  
        const response = await axios.put(
            `${process.env.BACKEND_URL}/rest/v6.1/subscriptions/${subscriptionId}/handset/block`,
            requestBody,
            {
                headers: {
                    'accept': 'application/json',
                    'accessKey': process.env.ACCESS_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
  
        res.json(response.data);
    } catch (error) {
        const statusCode = (error.response && error.response.status) ? error.response.status : 500;
        console.error("Error en blockDeviceByImei:", error.response && error.response.data ? error.response.data : error.message);
        res.status(statusCode).json({
            message: 'Error al procesar la solicitud de bloqueo',
            error: error.response && error.response.data ? error.response.data : error.message
        });
    }
});
  
// Endpoint para bloquear una SIM por número telefónico
app.put('/api-dtv/blockSimByPhoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ message: "El número telefónico es obligatorio" });
        }
        
        const customerResponse = await axios.get(`${process.env.BACKEND_URL}/rest/v6.1/customersBySubscription`, {
            params: { msisdn: phoneNumber },
            headers: {
                'accept': 'application/json',
                'accessKey': process.env.ACCESS_KEY
            }
        });
        
        const subscriptions = customerResponse.data.payload && customerResponse.data.payload.subscriptions ? customerResponse.data.payload.subscriptions : [];
        const subscriptionId = (subscriptions.length > 0 && subscriptions[0].id) ? subscriptions[0].id : null;
        
        if (!subscriptionId) {
            return res.status(400).json({ message: "No se pudo obtener el subscriptionId" });
        }
        
        const requestBody = {
            reason: "Theft reporting"
        };
        
        const response = await axios.put(
            `${process.env.BACKEND_URL}/rest/v6.1/subscriptions/${subscriptionId}/sim/block`,
            requestBody,
            {
                headers: {
                    'accept': 'application/json',
                    'accessKey': process.env.ACCESS_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json(response.data);
    } catch (error) {
        const statusCode = (error.response && error.response.status) ? error.response.status : 500;
        console.error("Error en blockSimByPhoneNumber:", error.response && error.response.data ? error.response.data : error.message);
        res.status(statusCode).json({
            message: 'Error al procesar la solicitud de bloqueo de SIM',
            error: error.response && error.response.data ? error.response.data : error.message
        });
    }
});
  
// Endpoint para consultar IMEI
app.post('/api-dtv/queryImei', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
  
        if (!phoneNumber) {
            return res.status(400).json({ message: "El número telefónico es obligatorio" });
        }
  
        const customerResponse = await axios.get(`${process.env.BACKEND_URL}/rest/v6.1/customersBySubscription`, {
            params: { msisdn: phoneNumber },
            headers: {
                'accept': 'application/json',
                'accessKey': process.env.ACCESS_KEY
            }
        });
  
        const subscriptions = customerResponse.data.payload && customerResponse.data.payload.subscriptions ? customerResponse.data.payload.subscriptions : [];
        const subscriptionId = (subscriptions.length > 0 && subscriptions[0].id) ? subscriptions[0].id : null;
  
        if (!subscriptionId) {
            return res.status(400).json({ message: "No se pudo obtener el subscriptionId" });
        }
  
        const response = await axios.post(
            `${process.env.BACKEND_URL}/rest/v6.1/handset/query/local/imei/status/subscriptions/${subscriptionId}`,
            {},
            {
                headers: {
                    'accept': 'application/json',
                    'accessKey': process.env.ACCESS_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
  
        res.json(response.data);
    } catch (error) {
        const statusCode = (error.response && error.response.status) ? error.response.status : 500;
        console.error("Error en queryImei:", error.response && error.response.data ? error.response.data : error.message);
        res.status(statusCode).json({
            message: 'Error al consultar el IMEI',
            error: error.response && error.response.data ? error.response.data : error.message
        });
    }
});
  
// --- Endpoints SOAP usando axios y xml2js ---

// Endpoint para obtener categorías de Trouble Ticket
app.get('/api-dtv/getTroubleTicketCategories', async (req, res) => {
    try {
        // Construir el XML de solicitud (igual que se usa en Postman)
        const xmlRequest = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:p="http://services.crm.ticketing.inew.com">
   <soapenv:Header/>
   <soapenv:Body>
      <p:getTroubleTicketCategories>
         <p:providerId>11</p:providerId>
         <p:getCategories>1</p:getCategories>
      </p:getTroubleTicketCategories>
   </soapenv:Body>
</soapenv:Envelope>`;
  
        // Enviar la petición SOAP al ESB
        const soapResponse = await axios.post(ticketingEndpoint, xmlRequest, {
            headers: {
                'Content-Type': 'text/xml',
                'Accept': 'text/xml'
            }
        });
  
        // Convertir la respuesta XML a JSON usando xml2js
        xml2js.parseString(soapResponse.data, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error("Error parseando XML:", err);
                return res.status(500).json({ message: 'Error parseando XML de respuesta', error: err.message });
            }
            try {
                const envelope = result['soapenv:Envelope'] || result.Envelope;
                const body = envelope['soapenv:Body'] || envelope.Body;
                const responseData = body['ser:getTroubleTicketCategories'] || body.getTroubleTicketCategories;
                return res.json(responseData);
            } catch (extractionError) {
                console.error("Error extrayendo datos del XML:", extractionError);
                return res.status(500).json({ message: 'Error extrayendo datos del XML', error: extractionError.message });
            }
        });
    } catch (error) {
        console.error("Error en la llamada SOAP:", error);
        const statusCode = (error.response && error.response.status) ? error.response.status : 500;
        res.status(statusCode).json({ message: 'Error llamando al servicio SOAP', error: error.message });
    }
});
  
// Endpoint SOAP para crear Trouble Ticket
app.post('/api-dtv/createTroubleTicket', async (req, res) => {
    try {
        const input = req.body;
        // Obtener la fecha actual en formato ISO sin milisegundos
        const now = new Date().toISOString(); // Ejemplo: "2025-02-21T14:47:03.123Z"
        const creationDate = now.split('.')[0] + 'Z'; // Resultado: "2025-02-21T14:47:03Z"
  
        // Procesar attachments (opcional)
        let attachmentXml = '';
        if (input.attachments) {
            const fileBuffer = fs.readFileSync(input.attachments.filePath);
            const base64File = fileBuffer.toString('base64');
            attachmentXml = `
         <p:attachments>
            <p:attachment>
               <p:filename>${input.attachments.fileName}</p:filename>
               <p:filetype>${input.attachments.fileType}</p:filetype>
               <p:file>${base64File}</p:file>
            </p:attachment>
         </p:attachments>`;
        }
  
        // Construir el XML de solicitud
        const xmlRequest = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:p="http://services.crm.ticketing.inew.com">
   <soapenv:Header/>
   <soapenv:Body>
      <p:createTroubleTicket>
         <p:providerId>11</p:providerId>
         <p:creationDate>${creationDate}</p:creationDate>
         <p:channel>CSR</p:channel>
         <p:categoryId>${input.categoryId}</p:categoryId>
         <p:subscriber>
            <p:msisdn>${input.msisdn}</p:msisdn>
         </p:subscriber>
         <p:title>${input.title}</p:title>
         <p:description>${input.description}</p:description>
         <appeal>false</appeal>
         ${attachmentXml}
      </p:createTroubleTicket>
   </soapenv:Body>
</soapenv:Envelope>`;
  
        // Enviar la petición SOAP al ESB
        const soapResponse = await axios.post(ticketingEndpoint, xmlRequest, {
            headers: {
                'Content-Type': 'text/xml',
                'Accept': 'text/xml'
            }
        });
  
        // Convertir la respuesta XML a JSON usando xml2js
        xml2js.parseString(soapResponse.data, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error("Error parseando XML:", err);
                return res.status(500).json({ message: 'Error parseando XML de respuesta', error: err.message });
            }
            try {
                const envelope = result['soapenv:Envelope'] || result.Envelope;
                const body = envelope['soapenv:Body'] || envelope.Body;
                const responseData = body['ser:createTroubleTicketResponse'] || body.createTroubleTicketResponse;
                return res.json(responseData);
            } catch (extractionError) {
                console.error("Error extrayendo datos del XML:", extractionError);
                return res.status(500).json({ message: 'Error extrayendo datos del XML', error: extractionError.message });
            }
        });
    } catch (error) {
        console.error("Error en createTroubleTicket:", error);
        const statusCode = (error.response && error.response.status) ? error.response.status : 500;
        return res.status(statusCode).json({ message: 'Error llamando al servicio SOAP', error: error.message });
    }
});

// Endpoint para traer tickets por MSISDN
// Endpoint para obtener tickets por MSISDN y mapear tanto status como categoryId
function mapStatus(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (let key in obj) {
      if (key === 'ser:status' || key === 'status') {
        if (obj[key] && statusMap[obj[key]]) {
          obj[key] = statusMap[obj[key]];
        }
      } else if (typeof obj[key] === 'object') {
        mapStatus(obj[key]);
      }
    }
    return obj;
  }
  
  // Función para mapear campos de categoría y otros (por ejemplo, mapear "ser:CUNId" a "cunId")
  function mapCategory(obj, catMapping) {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (let key in obj) {
      // Mapeo de categoría
      if (key === 'ser:categoryId' || key === 'categoryId') {
        let catId = String(obj[key]).trim();
        if (catId && catMapping[catId]) {
          obj[key] = catMapping[catId];
        } else if (obj['ser:categoryName']) {
          obj[key] = String(obj['ser:categoryName']).trim();
        }
      }
      // Mapeo para transformar "ser:CUNId" a "cunId"
      else if (key === 'ser:CUNId') {
        obj["cunId"] = String(obj[key]).trim();
        delete obj[key];
      }
      // Si es un objeto, se recurre
      else if (typeof obj[key] === 'object') {
        mapCategory(obj[key], catMapping);
      }
    }
    return obj;
  }
  
  app.get('/api-dtv/getTickedByMsisdn', async (req, res) => {
    try {
      const { msisdn } = req.query;
      if (!msisdn) {
        return res.status(400).json({ message: "El parámetro msisdn es obligatorio" });
      }
      
      // XML de solicitud para obtener tickets por MSISDN
      const xmlTicketRequest = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:p="http://services.crm.ticketing.inew.com">
     <soapenv:Header/>
     <soapenv:Body>
        <p:getTroubleTicketByMSISDN>
           <p:providerId>11</p:providerId>
           <p:msisdn>${msisdn}</p:msisdn>
        </p:getTroubleTicketByMSISDN>
     </soapenv:Body>
  </soapenv:Envelope>`;
      
      // XML de solicitud para obtener las categorías de tickets
      const xmlCategoryRequest = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:p="http://services.crm.ticketing.inew.com">
     <soapenv:Header/>
     <soapenv:Body>
        <p:getTroubleTicketCategories>
           <p:providerId>11</p:providerId>
           <p:getCategories>1</p:getCategories>
        </p:getTroubleTicketCategories>
     </soapenv:Body>
  </soapenv:Envelope>`;
      
      // Crear el parser de xml2js
      const parser = new xml2js.Parser({ explicitArray: false });
      
      // Llamada SOAP para obtener las categorías
      const categorySoapResponse = await axios.post(ticketingEndpoint, xmlCategoryRequest, {
        headers: {
          'Content-Type': 'text/xml',
          'Accept': 'text/xml'
        }
      });
      
      const categoryResult = await parser.parseStringPromise(categorySoapResponse.data);
      const envelopeCat = categoryResult['soapenv:Envelope'] || categoryResult.Envelope;
      const bodyCat = envelopeCat['soapenv:Body'] || envelopeCat.Body;
      const categoryResponse = bodyCat['ser:getTroubleTicketCategoriesResponse'] || bodyCat.getTroubleTicketCategoriesResponse;
      
      // Crear objeto de mapeo: { trimmedCategoryId: trimmedCategoryName }
      let categoriesMapping = {};
      if (categoryResponse && categoryResponse.categories && categoryResponse.categories['ser:category']) {
        let categoryArray = categoryResponse.categories['ser:category'];
        if (!Array.isArray(categoryArray)) {
          categoryArray = [categoryArray];
        }
        categoryArray.forEach(cat => {
          const key = String(cat['ser:categoryId'] || "").trim();
          const value = String(cat['ser:categoryName'] || "").trim();
          if (key) {
            categoriesMapping[key] = value;
          }
        });
      }
      
      // Llamada SOAP para obtener los tickets por MSISDN
      const ticketSoapResponse = await axios.post(ticketingEndpoint, xmlTicketRequest, {
        headers: {
          'Content-Type': 'text/xml',
          'Accept': 'text/xml'
        }
      });
      
      const ticketResult = await parser.parseStringPromise(ticketSoapResponse.data);
      const envelopeTicket = ticketResult['soapenv:Envelope'] || ticketResult.Envelope;
      const bodyTicket = envelopeTicket['soapenv:Body'] || envelopeTicket.Body;
      const responseData = bodyTicket['ser:getTroubleTicketByMSISDNResponse'] || bodyTicket.getTroubleTicketByMSISDNResponse;
      
      // Primero, mapear el campo status (usando la función mapStatus)
      const responseWithStatus = mapStatus(responseData);
      // Luego, mapear el campo categoryId (y transformar "ser:CUNId" a "cunId") usando el objeto de mapeo obtenido
      const mappedResponse = mapCategory(responseWithStatus, categoriesMapping);
      
      return res.json(mappedResponse);
      
    } catch (error) {
      console.error("Error en getTickedByMsisdn:", error);
      const statusCode = (error.response && error.response.status) ? error.response.status : 500;
      return res.status(statusCode).json({ message: 'Error llamando al servicio SOAP', error: error.message });
    }
  });
      
// Iniciar servidor
>>>>>>> 279578814ed81841fc666b620e94b6720f4dfecf
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
