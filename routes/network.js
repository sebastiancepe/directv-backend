const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL;
const ACCESS_KEY = process.env.ACCESS_KEY;

router.get('/getNetworkOperator', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const response = await axios.get(`${BACKEND_URL}/rest/v6.1/mnp/operators/${phoneNumber}`, {
      headers: {
        'accept': 'application/json',
        'accessKey': ACCESS_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    const statusCode = error.response && error.response.status ? error.response.status : 500;
    res.status(statusCode).json({ message: 'Error al obtener operador de red' });
  }
});

module.exports = router;
