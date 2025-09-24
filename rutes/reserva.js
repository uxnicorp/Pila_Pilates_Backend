const express = require('express');
const router = express.Router();
const { validarJWT } = require('../midelware/validarJWT');
const { cancelarReserva, marcarAsistencia } = require('../controllers/reserva');

// Ruta para cancelar reserva
// PUT /reserva/cancelar/:id
router.put('/cancelar/:id', validarJWT, cancelarReserva);

module.exports = router;

// Ruta para marcar asistencia (presente/ausente)
// PUT /reserva/asistencia/:id
router.put('/asistencia/:id', validarJWT, marcarAsistencia);
