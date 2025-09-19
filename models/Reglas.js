const { model, Schema } = require('mongoose');

const ReglasSchema = new Schema({

      titulo: {
        type: String,
        required: true,
        trim: true
    },

    descripcion: {
        type: String,
        required: true,
        trim: true 
    },

},
{ timestamps: true });


module.exports = model("Reglas", ReglasSchema);