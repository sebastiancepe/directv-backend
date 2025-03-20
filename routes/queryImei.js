const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL;
const ACCESS_KEY = process.env.ACCESS_KEY;

router.post('/queryImei', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: "El número telefónico es obligatorio" });
    }
    const customerResponse = await axios.get(`${BACKEND_URL}/rest/v6.1/customersBySubscription`, {
      params: { msisdn: phoneNumber },
      headers: {
        'accept': 'application/json',
        'accessKey': ACCESS_KEY
      }
    });

    const subscriptions = customerResponse.data.payload && customerResponse.data.payload.subscriptions
      ? customerResponse.data.payload.subscriptions
      : [];
    const subscriptionId = subscriptions.length > 0 && subscriptions[0].id ? subscriptions[0].id : null;

    if (!subscriptionId) {
      return res.status(400).json({ message: "No se pudo obtener el subscriptionId" });
    }

    const response = await axios.post(
      `${BACKEND_URL}/rest/v6.1/handset/query/local/imei/status/subscriptions/${subscriptionId}`,
      {},
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
    console.error("Error en queryImei:", error.response?.data || error.message);
    res.status(statusCode).json({
      message: 'Error al consultar el IMEI',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
