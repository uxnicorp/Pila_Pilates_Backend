
// Cancela la reserva de un usuario (baja lógica)
// Usar desde el front: PUT /reserva/cancelar/:id
const Reserva = require('../models/Reserva');

const cancelarReserva = async (req, res) => {
	try {
		const reservaId = req.params.id;
		const userId = req.id; // viene del JWT

		const reserva = await Reserva.findById(reservaId);
		if (!reserva) return res.status(404).json({ ok: false, msg: 'Reserva no encontrada' });

		// Log para depuración: ver valores y tipos
		console.log('cliente.id:', reserva.cliente?.id, 'userId:', userId);
		// Verifica que el usuario sea el dueño de la reserva (usando cliente.id, chequeando existencia)
		if (!reserva.cliente || !reserva.cliente.id || reserva.cliente.id.toString() !== userId.toString()) {
			return res.status(403).json({ ok: false, msg: 'No tenés permiso para cancelar esta reserva (cliente no asignado)' });
		}

		if (!reserva.estado) return res.status(400).json({ ok: false, msg: 'La reserva ya está cancelada' });

		reserva.estado = false;
		await reserva.save();
		return res.json({ ok: true, msg: 'Reserva cancelada correctamente' });
	} catch (error) {
		console.error('Error en cancelarReserva', error);
		res.status(500).json({ ok: false, msg: 'No se pudo cancelar la reserva' });
	}
}


// Cambia el estado de asistencia de una reserva (presente/ausente)
// Usar desde el front: PUT /reserva/asistencia/:id
const marcarAsistencia = async (req, res) => {
	try {
		const reservaId = req.params.id;
		const reserva = await Reserva.findById(reservaId);
		if (!reserva) return res.status(404).json({ ok: false, msg: 'Reserva no encontrada' });

		// Cambia el valor de asistencia (toggle)
		reserva.asistencia = !reserva.asistencia;
		await reserva.save();
		return res.json({ ok: true, msg: `Asistencia marcada como ${reserva.asistencia ? 'presente' : 'ausente'}` });
	} catch (error) {
		console.error('Error en marcarAsistencia', error);
		res.status(500).json({ ok: false, msg: 'No se pudo cambiar la asistencia' });
	}
}

module.exports = {
	cancelarReserva,
	marcarAsistencia,
};