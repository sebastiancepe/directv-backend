const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || 'tu_clave_secreta';
const user = process.env.user || 'usuario';
const pass = process.env.password || 'password';

// Endpoint para generar el token
router.post('/generateToken', (req, res) => {
    const { username, password } = req.body;

    if (username === user && password === pass) {
        const payload = { username };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    } else {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }
});

module.exports = router;
