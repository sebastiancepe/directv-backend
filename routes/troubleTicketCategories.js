const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const router = express.Router();

const ticketingEndpoint = process.env.TICKETING_ENDPOINT;

router.get('/getTroubleTicketCategories', async (req, res) => {
  try {
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
    const soapResponse = await axios.post(ticketingEndpoint, xmlRequest, {
      headers: {
        'Content-Type': 'text/xml',
        'Accept': 'text/xml'
      }
    });
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
    const statusCode = error.response && error.response.status ? error.response.status : 500;
    res.status(statusCode).json({ message: 'Error llamando al servicio SOAP', error: error.message });
  }
});

module.exports = router;
