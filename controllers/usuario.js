const Usuario = require('../models/Usuario');

// Guarda el playerId de OneSignal para el usuario logueado
// POST /api/usuarios/notificaciones
// Body: { playerId }
// Requiere JWT
const guardarPlayerId = async (req, res) => {
    try {
        console.log('📥 Petición recibida para guardar playerId');
        console.log('   - Body:', req.body);
        console.log('   - Usuario ID del JWT:', req.id);
        
        const { playerId } = req.body;
        const usuarioId = req.id; // viene del JWT

        if (!playerId) {
            console.log('❌ Falta el playerId en el body');
            return res.status(400).json({ ok: false, msg: 'Falta el playerId' });
        }

        if (!usuarioId) {
            console.log('❌ Falta el usuarioId del JWT');
            return res.status(401).json({ ok: false, msg: 'Usuario no autenticado' });
        }

        console.log(`🔄 Actualizando usuario ${usuarioId} con playerId: ${playerId}`);
        
        const resultado = await Usuario.updateOne(
            { _id: usuarioId },
            { $addToSet: { playerIds: playerId } } // agrega sin duplicar
        );

        console.log('✅ Resultado de la actualización:', resultado);
        console.log('   - Documentos encontrados:', resultado.matchedCount);
        console.log('   - Documentos modificados:', resultado.modifiedCount);

        // Verificar que se guardó correctamente
        const usuarioActualizado = await Usuario.findById(usuarioId).select('nombre apellido playerIds');
        console.log('👤 Usuario actualizado:', usuarioActualizado);

        res.json({ ok: true, msg: 'PlayerId guardado correctamente', playerIds: usuarioActualizado.playerIds });
    } catch (error) {
        console.error('❌ Error guardarPlayerId:', error);
        res.status(500).json({ ok: false, msg: 'No se pudo guardar el playerId', error: error.message });
    }
};

module.exports = {
    guardarPlayerId,
};
