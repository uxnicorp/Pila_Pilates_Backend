
// Cancela la reserva de un usuario (baja lógica)
// Usar desde el front: PUT /reserva/cancelar/:id
const Reserva = require('../models/Reserva');
const Turno = require('../models/Turno');
const Usuario = require('../models/Usuario');

//metodo para crear y guardar la reserva en turno
const crearReserva = async (req, res) => {
    const { turnoId, usuarioId, tipoPago, monto, metodoPago, membresiaId } = req.body;

    try {
        // VALIDACIÓN BÁSICA: Verificar campos requeridos
        if (!turnoId || !usuarioId || !tipoPago) {
            return res.status(400).json({
                ok: false,
                msg: 'Se debe proporcionar turnoId, usuarioId y tipoPago'
            });
        }

        // VALIDACIÓN MEJORADA: Verificar formato de tipoPago
        if (!['individual', 'membresia'].includes(tipoPago)) {
            return res.status(400).json({
                ok: false,
                msg: 'tipoPago debe ser "individual" o "membresia"'
            });
        }

        // VALIDACIÓN ESPECÍFICA: Para pago individual
        if (tipoPago === 'individual' && (!monto || !metodoPago)) {
            return res.status(400).json({
                ok: false,
                msg: 'Para pago individual se requiere monto y metodoPago'
            });
        }

        // VALIDACIÓN ESPECÍFICA: Para membresía
        if (tipoPago === 'membresia' && !membresiaId) {
            return res.status(400).json({
                ok: false,
                msg: 'Para membresía se requiere membresiaId'
            });
        }

        // BUSCAR EL TURNO - Una sola consulta
        const turno = await Turno.findById(turnoId);
        
        if (!turno) {
            return res.status(404).json({
                ok: false,
                msg: 'Turno no encontrado'
            });
        }

        // VALIDAR QUE EL TURNO ESTÉ ACTIVO
        if (!turno.activo) {
            return res.status(400).json({
                ok: false,
                msg: 'Este turno ha sido cancelado'
            });
        }

        // VALIDAR CUPOS DISPONIBLES
        if (turno.reservas.length >= turno.cupo_maximo) {
            return res.status(400).json({
                ok: false,
                msg: 'No hay cupos disponibles en este turno'
            });
        }

        // BUSCAR EL USUARIO - Una sola consulta (para obtener datos)
        const usuario = await Usuario.findById(usuarioId);
        
        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }

        // VALIDAR QUE EL USUARIO NO TENGA YA UNA RESERVA EN ESTE TURNO
        const reservaExistente = await Reserva.findOne({
            usuario: usuarioId,
            fecha_reserva: turno.fecha,
            hora_reserva: turno.hora_inicio
        });

        if (reservaExistente) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya tienes una reserva en este turno'
            });
        }

        // PREPARAR DATOS DE LA RESERVA
        const datosReserva = {
            usuario: usuarioId,
            cliente: {
                id: usuarioId,
                nombre: usuario.nombre,
                apellido: usuario.apellido
            },
            fecha_reserva: turno.fecha,
            hora_reserva: turno.hora_inicio,
            servicio: turno.servicio,
            estado: true,
            asistencia: false
        };

        // AGREGAR DATOS DE PAGO SEGÚN TIPO
        if (tipoPago === 'individual') {
            datosReserva.pago_unico = {
                monto: monto,
                fecha: new Date(),
                metodo: metodoPago
            };
        } else if (tipoPago === 'membresia') {
            datosReserva.membresias = {
                fecha_inicio: new Date(),
                fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 días
            };
        }

        // OPERACIÓN ÚNICA EN LA BD: Crear la reserva
        const nuevaReserva = new Reserva(datosReserva);
        const reservaCreada = await nuevaReserva.save();

        // ACTUALIZAR EL TURNO CON LA NUEVA RESERVA
        await Turno.findByIdAndUpdate(
            turnoId,
            { 
                $push: { reservas: reservaCreada._id }
            }
        );

        // RESPUESTA EXITOSA
        res.status(201).json({
            ok: true,
            msg: 'Reserva creada exitosamente',
            reserva: {
                id: reservaCreada._id,
                cliente: reservaCreada.cliente,
                fecha: reservaCreada.fecha_reserva,
                hora: reservaCreada.hora_reserva,
                servicio: reservaCreada.servicio,
                tipoPago: tipoPago
            },
            turno: {
                id: turno._id,
                cuposDisponibles: turno.cupo_maximo - (turno.reservas.length + 1),
                profesional: turno.profesional
            }
        });

    } catch (error) {
        console.error('Error en crearReserva:', error);

        // Manejar errores de duplicados (por si acaso)
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                msg: 'Error: Ya existe una reserva para este usuario y turno'
            });
        }

        res.status(500).json({
            ok: false,
            msg: 'Error inesperado al crear la reserva: ' + error.message
        });
    }
};


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
	crearReserva
};