const { model, Schema } = require('mongoose');

const Pago_mantenmientoSchema = new Schema({

    descripcion: {
        type: Boolean,
        default: true //pago: true - no pago: false
    },

},
{ timestamps: true });


module.exports = model("Pago_mantenimiento", Pago_mantenmientoSchema);