const express = require('express');

const { check } = require('express-validator');
const { validarCampos } = require('../midelware/validarCampos');
const { crearUsuario, startLogin } = require('../controllers/auth');
const { validarJWTAdmin } = require('../midelware/ValidarJWTAdmin');
const { crearTurnosEnLote, obtenerEmpleados, cargarTurnos } = require('../controllers/admin');
const { validarJWT } = require('../midelware/validarJWT');
//const { loginUsuario } = require('../controllers/auth');

const routerAdmin = express.Router();


//para crear turnos en lote 
// (faltan validacion de datos como que venga fechas horas y en el formato correcto etc)
routerAdmin.post('/lote',validarJWTAdmin, crearTurnosEnLote);

//obtiene los empleados de la DB
routerAdmin.get('/empleados',validarJWTAdmin, obtenerEmpleados);

//obtener turnos
routerAdmin.get('/turnos', validarJWT,cargarTurnos);


module.exports = routerAdmin;