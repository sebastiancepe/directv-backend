const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL;
const ACCESS_KEY = process.env.ACCESS_KEY;

router.put('/portInRequest', async (req, res) => {
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

    if (!subscriberId) {
      return res.status(400).json({ message: "El subscriberId es obligatorio" });
    }
    if (!newMsisdn) {
      return res.status(400).json({ message: "El newMsisdn es obligatorio" });
    }
    if (subscriberType !== "NATURAL" && subscriberType !== "COMPANY") {
      return res.status(400).json({ message: "subscriberType debe ser NATURAL o COMPANY" });
    }
    if (!transparentData || !transparentData.subscriberIdentityType) {
      return res.status(400).json({ message: "transparentData.subscriberIdentityType es obligatorio" });
    }
    const allowedIdTypes = ["ID", "NIT", "FOREIGN_ID", "PASSPORT"];
    if (!allowedIdTypes.includes(transparentData.subscriberIdentityType)) {
      return res.status(400).json({ message: "subscriberIdentityType debe ser ID, NIT, FOREIGN_ID o PASSPORT" });
    }
    if (!transparentData || !transparentData.subscriberServiceType) {
      return res.status(400).json({ message: "transparentData.subscriberServiceType es obligatorio" });
    }
    const allowedServiceTypes = ["PREPAID", "POSTPAID"];
    if (!allowedServiceTypes.includes(transparentData.subscriberServiceType)) {
      return res.status(400).json({ message: "subscriberServiceType debe ser PREPAID o POSTPAID" });
    }

    const futureDateObj = new Date(requestedFutureDate);
    if (isNaN(futureDateObj.getTime())) {
      return res.status(400).json({ message: "requestedFutureDate no es una fecha válida" });
    }
    const formattedRequestedFutureDate = futureDateObj.toISOString();

    const identityIssueObj = new Date(transparentData.subscriberIdentityIssue);
    if (isNaN(identityIssueObj.getTime())) {
      return res.status(400).json({ message: "transparentData.subscriberIdentityIssue no es una fecha válida" });
    }
    const year = identityIssueObj.getFullYear();
    const month = ('0' + (identityIssueObj.getMonth() + 1)).slice(-2);
    const day = ('0' + identityIssueObj.getDate()).slice(-2);
    transparentData.subscriberIdentityIssue = `${year}/${month}/${day}`;

    const requestBodyData = {
      authCode,
      donorOperator,
      newMsisdn,
      recipientOperator,
      requestedFutureDate: formattedRequestedFutureDate,
      subscriberType,
      transparentData
    };

    const response = await axios.put(
      `${BACKEND_URL}/rest/v6.1/mnp/portin/subscriptions/${subscriberId}`,
      requestBodyData,
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
    console.error("Error en portInRequest:", error.response?.data || error.message);
    res.status(statusCode).json({
      message: 'Error al procesar la solicitud de portabilidad',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
