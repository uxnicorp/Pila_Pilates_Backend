const { model, Schema } = require('mongoose');

const MembresiaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }, // referencia al usuario dueño de la membresía

    // 👤 Snapshot mínimo (opcional, para reportes rápidos sin populate)
    participante: {
        nombre: { type: String },
        apellido: { type: String }
    },

    fecha_inicio: { type: Date, required: true },
    fecha_fin: { type: Date, required: true },

    monto: { type: Number, required: true },

    metodo_pago: { type: String }, // ej: 'efectivo', 'tarjeta', 'transferencia'

    //NO AGREGAREMOS TIPO (semanal, mensual, trimestral) PERO SERA OPCIONAL EN EL FUTURO O PARA PROPONER!
},
{ timestamps: true });

// Índice para optimizar búsquedas por usuario + rango
MembresiaSchema.index({ usuario: 1, fecha_inicio: 1, fecha_fin: 1 });

module.exports = model("Membresia", MembresiaSchema);