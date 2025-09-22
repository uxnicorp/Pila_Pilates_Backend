const { model, Schema } = require('mongoose');

const TurnoSchema = new Schema({
    fecha: { type: Date, required: true },
    hora_inicio: { type: String, required: true },
    hora_fin: { type: String, required: true },

    servicio: { type: String, default: "Pilates" }, // opcional si querés manejar otros servicios

    profesional: { 
       nombre: { type: String },
        apellido: { type: String }
    },

    reservas: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Reserva'
        }
    ],


    //no contemplamos salon en este caso ni la localidad pero pueden estar en un modelo escalable.
    cupo_maximo: { type: Number, default: 5 },

},
{ timestamps: true });

// Índice para buscar turnos rápido por fecha+hora
TurnoSchema.index({ fecha: 1, hora_inicio: 1 }, { unique: true });

module.exports = model("Turno", TurnoSchema);