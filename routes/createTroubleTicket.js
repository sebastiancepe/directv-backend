const express = require('express');
const axios = require('axios');
const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');
const router = express.Router();

const ticketingEndpoint = process.env.TICKETING_ENDPOINT;

router.post('/createTroubleTicket', async (req, res) => {
  try {
    const input = req.body;
    const now = new Date().toISOString();
    const creationDate = now.split('.')[0] + 'Z';

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
        const responseData = body['ser:createTroubleTicketResponse'] || body.createTroubleTicketResponse;
        return res.json(responseData);
      } catch (extractionError) {
        console.error("Error extrayendo datos del XML:", extractionError);
        return res.status(500).json({ message: 'Error extrayendo datos del XML', error: extractionError.message });
      }
    });
  } catch (error) {
    console.error("Error en createTroubleTicket:", error);
    const statusCode = error.response && error.response.status ? error.response.status : 500;
    return res.status(statusCode).json({ message: 'Error llamando al servicio SOAP', error: error.message });
  }
});

module.exports = router;
