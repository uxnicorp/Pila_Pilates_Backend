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
const startLogin = async (req, res) => {
    const {email, password} = req.body
    try {
        const user = await Usuario.findOne({email})
        if (!user){
            return res.status(401).json({
                ok: false,
                msg: "No existe ningún usuario registrado con ese correo electrónico."
            })
        }

        const validarPassword = bcryptjs.compareSync(password, user.password)
        if(!validarPassword){
            return res.status(401).json({
                ok: false,
                msg: "Contraseña inválida."
            })
        }

        if (!user.estado){
            return res.status(403).json({
                ok: false,
                msg: "Usuario inhabilitado, contáctese con el administrador"
            })
        }


        //TOKEN
        const payload = {user:user}
        const token = jwt.sign(payload, process.env.SECRET_JWT, {expiresIn:"6h"});

        res.status(200).json({
            ok: true,
            user:user,
            token
        })

    }

    catch (error) {
        console.error("error en login", error);
        res.status(500).json({
            ok: false,
            msg: "Error interno del servidor. Por favor contacte al administrador"
        });
    }
}


module.exports = {
    crearUsuario, startLogin,
};