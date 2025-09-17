const bcryptjs = require('bcrypt');
const jwt = require("jsonwebtoken");
const Usuario = require('../models/Usuario');


//crear usuario 
const crearUsuario = async (req, res) => {
    const { nombre, apellido, email, userName, password, telefono, } = req.body;

    try {
        // Validar campos obligatorios
        if (!nombre || !apellido || !email || !password || !userName || !telefono){
            return res.status(400).json({
                ok: false,
                msg: "Faltan campos obligatorios"
            });
        }

        // Verificar si el usuario ya existe
        let user = await Usuario.findOne({ email });
        if (user) {
            return res.status(400).json({
                ok: false,
                msg: "Ya existe un usuario con esa direccion de correo electronico"
            });
        }

        // Crear nuevo usuario con datos mínimos requeridos
        user = new Usuario({
            nombre,
            apellido,
            email,
            userName,
            password, // Será encriptado
            //rol,   
            telefono,
            //estado // Por defecto activo
        });

        // Encriptar contraseña
        const salt = bcryptjs.genSaltSync(10);
        user.password = bcryptjs.hashSync(password, salt);

        // Guardar usuario
        await user.save();


        // Respuesta exitosa
        res.status(201).json({
            ok: true,
            msg: 'Usuario creado correctamente'
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            ok: false,
            msg: "Error interno del servidor. Por favor contacte al administrador"
        });
    }
};


//login del usuario



module.exports = {
    crearUsuario,

};