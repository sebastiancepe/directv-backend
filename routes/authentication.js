const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL;
const ACCESS_KEY = process.env.ACCESS_KEY;

router.post('/postSendAuthentication', async (req, res) => {
  try {
    const { phoneNumber, subscriberId, operatorCode } = req.body;
    const requestBody = {
      msisdn: phoneNumber,
      transparentData: { donorOperator: operatorCode }
    };

    const response = await axios.post(
      `${BACKEND_URL}/rest/v6.1/mnp/authentication/send/subscriptions/${subscriberId}`,
      requestBody,
      {
        headers: {
          'accept': 'application/json',
          'accessKey': ACCESS_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    const statusCode = error.response && error.response.status ? error.response.status : 500;
    console.error("Error en postSendAuthentication:", error.response?.data || error.message);
    res.status(statusCode).json({
      message: 'Error al enviar autenticación NIP',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
