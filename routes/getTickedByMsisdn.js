const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const verifyToken = require('../middlewares/jwtAuth.js');
const statusMap = require('../ticketStatusMap.json');

const router = express.Router();
const ticketingEndpoint = process.env.TICKETING_ENDPOINT;


function mapStatus(obj) {
    // Si no es objeto, retorna tal cual
    if (typeof obj !== 'object' || obj === null) return obj;
    for (let key in obj) {
      if (key === 'ser:status' || key === 'status') {
        if (obj[key] && statusMap[obj[key]]) {
          obj[key] = statusMap[obj[key]];
        }
      } else if (typeof obj[key] === 'object') {
        obj[key] = mapStatus(obj[key]);
      }
    }
    return obj;
  }




router.get('/getTickedByMsisdn', verifyToken, async (req, res) => {
    try {
        const { msisdn } = req.query;
        if (!msisdn) {
            return res.status(400).json({ message: "El parámetro msisdn es obligatorio" });
        }

        // Construcción del XML para la petición SOAP
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

        const parser = new xml2js.Parser({ explicitArray: false });

        // Realizar la llamada al servicio SOAP
        const ticketSoapResponse = await axios.post(ticketingEndpoint, xmlTicketRequest, {
            headers: {
                'Content-Type': 'text/xml',
                'Accept': 'text/xml'
            }
        });

               

        // Parsear respuesta SOAP
        const ticketResult = await parser.parseStringPromise(ticketSoapResponse.data);
        const envelopeTicket = ticketResult['soapenv:Envelope'] || ticketResult.Envelope;
        const bodyTicket = envelopeTicket['soapenv:Body'] || envelopeTicket.Body;
        const responseData = bodyTicket['ser:getTroubleTicketByMSISDNResponse'] || bodyTicket.getTroubleTicketByMSISDNResponse;
        const responseWithStatus = mapStatus(responseData);
        
        return res.json(responseWithStatus);
    } catch (error) {
        console.error("Error en getTickedByMsisdn:", error);
        return res.status(500).json({ message: 'Error llamando al servicio SOAP', error: error.message });
    }
});

module.exports = router;
