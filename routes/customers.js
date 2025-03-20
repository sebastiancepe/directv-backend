const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL;
const ACCESS_KEY = process.env.ACCESS_KEY;

router.get('/getCustomersBySubscription', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    console.log(BACKEND_URL);
    console.log(phoneNumber);
    const response = await axios.get(`${BACKEND_URL}/rest/v6.1/customersBySubscription`, {
      params: { msisdn: phoneNumber },
      headers: {
        'accept': 'application/json',
        'accessKey': ACCESS_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    const statusCode = error.response && error.response.status ? error.response.status : 500;
    console.log(error);
    res.status(statusCode).json({ message: 'Error al obtener datos de suscripción' });
  }
});

module.exports = router;
