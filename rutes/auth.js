const express = require('express');

const { check } = require('express-validator');
const { validarCampos } = require('../midelware/validarCampos');
const { crearUsuario, startLogin } = require('../controllers/auth');
//const { loginUsuario } = require('../controllers/auth');

const routerAuth = express.Router();


//para logear usuario
routerAuth.post('/login',
  [
    check("email", "El email es obligatorio").not().isEmpty(),
    check("password", "La contraseña es obligatoria").not().isEmpty(),
    validarCampos
  ],
  startLogin
);

//para crear un nuevo usuario
routerAuth.post('/new-user',
  [
    check("nombre", "El nombre es obligatorio").not().isEmpty().trim(),
    check("apellido", "El apellido es obligatorio").not().isEmpty().trim(),
    check("email", "El email es obligatorio").not().isEmpty().isEmail().normalizeEmail(),
    check("telefono", "El teléfono es obligatorio").not().isEmpty().isMobilePhone(),
    check("password", "la contraseña debe ser de minimo 5").isLength({
      min: 5,
    }),

    validarCampos,

  ], crearUsuario
);


module.exports = routerAuth;