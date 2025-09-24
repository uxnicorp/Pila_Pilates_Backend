const { model, Schema } = require('mongoose');

const ReservaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }, // referencia al usuario que reservó

    // Cliente: snapshot y referencia robusta
    cliente: {
        id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: false },
        nombre: { type: String },
        apellido: { type: String }
    },

    estado: {
        type: Boolean,
        default: true //true: agendado - false: cancelado
    },

    asistencia: {
        type: Boolean,
        default: false //true: presente - false: ausente
    },

    /*
     pago_unico: Si el cliente paga una clase suelta, acá se guarda el monto, la fecha y el método de pago (por ejemplo: efectivo, tarjeta, transferencia).
    */
    pago_unico: {
        monto: { type: Number },
        fecha: { type: Date },
        metodo: { type: String }
    },

    /*
     membresias: Si el cliente tiene una membresía activa que se aplica a esta reserva, acá se guarda la fecha de inicio y fin de esa membresía.
    */
    membresias: {
        fecha_inicio: { type: Date },
        fecha_fin: { type: Date },
    },

    //  Info de la clase/turno reservado
    fecha_reserva: { type: Date, required: true },
    hora_reserva: { type: String, required: true },
    servicio: { type: String } // Ej: "Pilates", "Yoga"
},
    { timestamps: true });

module.exports = model("Reserva", ReservaSchema);