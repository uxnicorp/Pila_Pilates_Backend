const { model, Schema } = require('mongoose');

const GastosSchema = new Schema({

      descripcion: {
        type: String,
        required: true,
        trim: true
    },

    monto: {
        type: Number,
        required: true,
    },

     metodo_pago: {
        type: String,
        required: true, // ej: 'efectivo', 'tarjeta', 'transferencia
        trim: true
    },


},
{ timestamps: true });


module.exports = model("Gastos", GastosSchema);