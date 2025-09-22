const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    // === Datos Básicos ===
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    apellido: {
        type: String,
        required: true,
        trim: true 
    },

    // === Contacto ===
    email: {
        type: String,
        required: true,
        unique: true
    },

    telefono: {
        type: String,
        required: true
    },

    estado: {
        type: Boolean,
        default: true
    },


    password: {
        type: String,
        required: true
    },

    // === Roles y Jerarquía ===
    rol: {
        type: String,
        enum: ["cliente","admin","empleado"],
        default: "cliente"
    },


});

module.exports = model("Usuario", userSchema);