const express = require('express');
const router = express.Router();
const { validarJWT } = require('../midelware/validarJWT');
const { guardarPlayerId } = require('../controllers/usuario');

// Ruta para guardar el playerId de OneSignal
// POST /api/usuarios/notificaciones
router.post('/notificaciones', validarJWT, guardarPlayerId);

module.exports = router;
