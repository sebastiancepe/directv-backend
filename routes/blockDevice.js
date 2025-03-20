const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL;
const ACCESS_KEY = process.env.ACCESS_KEY;

router.put('/blockDeviceByImei', async (req, res) => {
  try {
    const { phoneNumber, imei, eventDate, reportDate, reportType, reporter, reporterDocument, victimEmail, victimMinor, violenceApplied, weaponApplied } = req.body;
    if (!phoneNumber || !imei || !eventDate || !reportDate || !reportType || !reporter || !reporterDocument || !victimEmail || victimMinor === undefined || violenceApplied === undefined) {
      return res.status(400).json({ message: "Todos los campos obligatorios deben ser proporcionados" });
    }
    const { address, city, name, phone, state } = reporter;
    if (!address || !city || !name || !phone || !state) {
      return res.status(400).json({ message: "Todos los campos dentro de 'reporter' son obligatorios" });
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
      violenceApplied,
      weaponApplied: violenceApplied ? weaponApplied : null
    };

    const response = await axios.put(
      `${BACKEND_URL}/rest/v6.1/subscriptions/${subscriptionId}/handset/block`,
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
    console.error("Error en blockDeviceByImei:", error.response?.data || error.message);
    res.status(statusCode).json({
      message: 'Error al procesar la solicitud de bloqueo',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
