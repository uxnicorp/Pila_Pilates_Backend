const express = require('express');
const router = express.Router();
const { validarJWT } = require('../midelware/validarJWT');
const { obtenerTurnosSegunRol, bajaLogicaTurno } = require('../controllers/turnos');

// GET /turnos/mis?type=all|active|historic
router.get('/mis', validarJWT, obtenerTurnosSegunRol);

module.exports = router;

// Ruta para dar de baja lógica un turno
// PUT /turnos/baja/:id
router.put('/baja/:id', validarJWT, bajaLogicaTurno);
