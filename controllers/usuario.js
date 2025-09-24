const Usuario = require('../models/Usuario');

// Guarda el playerId de OneSignal para el usuario logueado
// POST /api/usuarios/notificaciones
// Body: { playerId }
// Requiere JWT
const guardarPlayerId = async (req, res) => {
    try {
        const { playerId } = req.body;
        const usuarioId = req.id; // viene del JWT

        if (!playerId) return res.status(400).json({ ok: false, msg: 'Falta el playerId' });

        await Usuario.updateOne(
            { _id: usuarioId },
            { $addToSet: { playerIds: playerId } } // agrega sin duplicar
        );

        res.json({ ok: true, msg: 'PlayerId guardado correctamente' });
    } catch (error) {
        console.error('Error guardarPlayerId', error);
        res.status(500).json({ ok: false, msg: 'No se pudo guardar el playerId' });
    }
};

module.exports = {
    guardarPlayerId,
};
