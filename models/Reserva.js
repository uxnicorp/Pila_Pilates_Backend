const { model, Schema } = require('mongoose');

const ReservaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }, // referencia al usuario que reservó

    // 👤 Snapshot mínimo para el admin (opcional, no duplicamos todo)
    participante: {
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

    // Pagos puntuales (ej: si el cliente paga una clase individual)
    pago_unico: {
        monto: { type: Number },
        fecha: { type: Date },
        metodo: { type: String } // ej: 'efectivo', 'tarjeta', 'transferencia'
    },

    // Membresías activas o aplicadas a esta reserva
    membresias: 
        {
            fecha_inicio: { type: Date },
            fecha_fin: { type: Date },
        }
    ,

    //  Info de la clase/turno reservado
    fecha_reserva: { type: Date, required: true },
    hora_reserva: { type: String, required: true },
    servicio: { type: String } // Ej: "Pilates", "Yoga"
},
    { timestamps: true });

module.exports = model("Reserva", ReservaSchema);