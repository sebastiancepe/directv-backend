// Importar dependencias
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors'); 
const soap = require('soap');
const fs = require('fs'); // se usará para procesar attachments
const path = require('path');
const xml2js = require('xml2js');

// Cargar variables de entorno
dotenv.config({ path: 'config.env' });

// Constantes
const ticketingEndpoint = process.env.TICKETING_ENDPOINT;
const app = express();
const PORT = process.env.PORT || 3000;
const wsdlPath = path.join(__dirname, 'ticketing.wsdl');

// Middleware para permitir CORS
app.use(cors({
    origin: 'http://localhost:4200', // Permite solicitudes solo desde Angular
    methods: 'GET,POST,PUT',
    allowedHeaders: 'Content-Type,Authorization'
}));

// Middleware para parsear JSON
app.use(express.json());

// Endpoint para obtener datos de suscripción
app.get('/api/getCustomersBySubscription', async (req, res) => {
    try {
        const { phoneNumber } = req.query;
        console.log(process.env.BACKEND_URL);
        console.log(phoneNumber);
        const response = await axios.get(`${process.env.BACKEND_URL}/rest/v6.1/customersBySubscription`, {
            params: { msisdn: phoneNumber },
            headers: {
                'accept': 'application/json',
                'accessKey': process.env.ACCESS_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ message: 'Error al obtener datos de suscripción' });
        console.log(error);
    }
});

// Endpoint para obtener el operador de red
app.get('/api/getNetworkOperator', async (req, res) => {
    try {
        const { phoneNumber } = req.query;
        const response = await axios.get(`${process.env.BACKEND_URL}/rest/v6.1/mnp/operators/${phoneNumber}`, {
            headers: {
                'accept': 'application/json',
                'accessKey': process.env.ACCESS_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ message: 'Error al obtener operador de red' });
    }
});

// Endpoint para enviar autenticación NIP
app.post('/api/postSendAuthentication', async (req, res) => {
    try {
        const { phoneNumber, subscriberId, operatorCode } = req.body;
        
        const requestBody = {
            msisdn: phoneNumber, 
            transparentData: { donorOperator: operatorCode }
        };

        const response = await axios.post(
            `${process.env.BACKEND_URL}/rest/v6.1/mnp/authentication/send/subscriptions/${subscriberId}`,
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
        console.error("Error en postSendAuthentication:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: 'Error al enviar autenticación NIP',
            error: error.response?.data || error.message
        });
    }
});

// Endpoint para solicitud de portabilidad (portInRequest)
app.put('/api/portInRequest', async (req, res) => {
    try {
        const {
            subscriberId,
            authCode,
            donorOperator,
            recipientOperator,
            requestedFutureDate,
            subscriberType,
            transparentData
        } = req.body;

        if (!subscriberId) {
            return res.status(400).json({ message: "El subscriberId es obligatorio" });
        }

        const requestBody = {
            authCode,
            donorOperator,
            recipientOperator,
            requestedFutureDate,
            subscriberType,
            transparentData
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
        console.error("Error en portInRequest:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: 'Error al procesar la solicitud de portabilidad',
            error: error.response?.data || error.message
        });
    }
});

// Endpoint para bloquear un dispositivo por IMEI
app.put('/api/blockDeviceByImei', async (req, res) => {
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

        const { subscriptions } = customerResponse.data.payload;
        const subscriptionId = subscriptions?.[0]?.id;
        
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
        console.error("Error en blockDeviceByImei:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: 'Error al procesar la solicitud de bloqueo',
            error: error.response?.data || error.message
        });
    }
});

// Endpoint para bloquear una SIM por número telefónico
app.put('/api/blockSimByPhoneNumber', async (req, res) => {
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
        
        const { subscriptions } = customerResponse.data.payload;
        const subscriptionId = subscriptions?.[0]?.id;
        
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
        console.error("Error en blockSimByPhoneNumber:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: 'Error al procesar la solicitud de bloqueo de SIM',
            error: error.response?.data || error.message
        });
    }
});

// Endpoint para consultar IMEI
app.post('/api/queryImei', async (req, res) => {
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

        const { subscriptions } = customerResponse.data.payload;
        const subscriptionId = subscriptions?.[0]?.id;

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
        console.error("Error en queryImei:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: 'Error al consultar el IMEI',
            error: error.response?.data || error.message
        });
    }
});


// --- Endpoints SOAP usando axios y xml2js ---

// Endpoint para obtener categorías de Trouble Ticket
app.get('/api/getTroubleTicketCategories', async (req, res) => {
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
                // Extraer el contenido esperado del Envelope
                const envelope = result['soapenv:Envelope'] || result.Envelope;
                const body = envelope['soapenv:Body'] || envelope.Body;
                // La respuesta puede venir con el prefijo "ser:" o sin él
                const responseData = body['ser:getTroubleTicketCategories'] || body.getTroubleTicketCategories;
                return res.json(responseData);
            } catch (extractionError) {
                console.error("Error extrayendo datos del XML:", extractionError);
                return res.status(500).json({ message: 'Error extrayendo datos del XML', error: extractionError.message });
            }
        });
    } catch (error) {
        console.error("Error en la llamada SOAP:", error);
        res.status(500).json({ message: 'Error llamando al servicio SOAP', error: error.message });
    }
});


// ----------------------------------------------------------------
// ENDPOINT SOAP para crear Trouble Ticket
// ----------------------------------------------------------------
app.post('/api/createTroubleTicket', async (req, res) => {
    try {
        const input = req.body;
        // Obtener la fecha actual en formato ISO sin milisegundos
        const now = new Date().toISOString(); // Ej: "2025-02-21T14:47:03.123Z"
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

        // Construir el XML de solicitud con la estructura requerida
        // Los campos fijos son:
        //   providerId: 11
        //   creationDate: fecha/hora actual en formato "YYYY-MM-DDTHH:MM:SSZ"
        //   channel: CSR
        //   appeal: false
        // categoryId, msisdn, title y description son parámetros de entrada
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
                // Aquí extraemos la respuesta en el elemento "ser:createTroubleTicketResponse"
                const responseData = body['ser:createTroubleTicketResponse'] || body.createTroubleTicketResponse;
                return res.json(responseData);
            } catch (extractionError) {
                console.error("Error extrayendo datos del XML:", extractionError);
                return res.status(500).json({ message: 'Error extrayendo datos del XML', error: extractionError.message });
            }
        });
    } catch (error) {
        console.error("Error en createTroubleTicket:", error);
        return res.status(500).json({ message: 'Error llamando al servicio SOAP', error: error.message });
    }
});



// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
