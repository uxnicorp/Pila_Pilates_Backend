

// Acá manejamos los turnos según quién sos:
// - Si sos admin, ves todos los turnos.
// - Si sos empleado, ves los turnos donde trabajaste.
// - Si sos cliente, ves los turnos donde participaste (buscando por nombre, apellido o id).
// La idea es que cada uno vea lo que le corresponde, sin repetir turnos.

const Turno = require('../models/Turno');
const Reserva = require('../models/Reserva');
const Usuario = require('../models/Usuario');


// Esto te da la fecha de hoy a las 00:00, para separar los turnos activos de los viejos
const startOfToday = () => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
}

// Ruta: GET /turnos/mis?type=all|active|historic
// Según el rol, te trae los turnos que te tocan:
// - type=all: todos
// - type=active: los que faltan
// - type=historic: los que ya pasaron
const obtenerTurnosSegunRol = async (req, res) => {
    try {
        const { type = 'all' } = req.query; // por defecto todos
        const rol = req.rol || 'cliente';
        const userId = req.id;

        const today = startOfToday();

        // Filtros según type
        const filtroActivo = { fecha: { $gte: today } };
        const filtroHistorico = { fecha: { $lt: today } };


    // Si sos admin, ves todos los turnos (podés filtrar por activos o históricos)
        if (rol === 'admin') {
            let query = { activo: true };
            if (type === 'active') query = { ...filtroActivo, activo: true };
            if (type === 'historic') query = { ...filtroHistorico, activo: true };

            const turnos = await Turno.find(query).populate({
                path: 'reservas',
                populate: { path: 'usuario', select: 'nombre apellido email' }
            }).lean();

            return res.json({ ok: true, turnos });
        }


    // Si sos empleado, ves los turnos donde fuiste el profesional
        if (rol === 'empleado') {
            let baseFilter = {
                'profesional.id': userId
            };

            if (type === 'active') Object.assign(baseFilter, filtroActivo);
            if (type === 'historic') Object.assign(baseFilter, filtroHistorico);

            const turnos = await Turno.find(baseFilter).populate({
                path: 'reservas',
                populate: { path: 'usuario', select: 'nombre apellido email' }
            }).lean();

            return res.json({ ok: true, turnos });
        }


    // Si sos cliente, revisamos todos los turnos y buscamos en cada reserva si tu nombre/apellido o tu id aparecen
    // Así te mostramos todos los turnos donde estuviste, aunque haya reservas viejas o datos duplicados
        if (rol === 'cliente') {
            let turnoFilter = {};
            if (type === 'active') turnoFilter = filtroActivo;
            if (type === 'historic') turnoFilter = filtroHistorico;

            // Obtener datos del usuario autenticado
            const usuario = await Usuario.findById(userId).select('nombre apellido');
            if (!usuario) return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });

            // Buscar todos los turnos y sus reservas
            const turnos = await Turno.find(turnoFilter).populate({
                path: 'reservas',
                populate: { path: 'usuario', select: 'nombre apellido email' }
            }).lean();

            // Filtrar turnos donde el cliente tiene al menos una reserva activa (estado: true)
            const turnosCliente = [];
            const turnoIdsSet = new Set();
            for (const turno of turnos) {
                if (!turno.reservas || turno.reservas.length === 0) continue;
                const match = turno.reservas.some(reserva => {
                    // Solo reservas activas
                    if (!reserva.estado) return false;
                    // Coincidencia por id
                    if (reserva.cliente && reserva.cliente.id && reserva.cliente.id.toString() === userId.toString()) return true;
                    // Coincidencia por nombre/apellido
                    if (reserva.cliente && reserva.cliente.nombre && reserva.cliente.apellido) {
                        return (
                            reserva.cliente.nombre.trim().toLowerCase() === usuario.nombre.trim().toLowerCase() &&
                            reserva.cliente.apellido.trim().toLowerCase() === usuario.apellido.trim().toLowerCase()
                        );
                    }
                    // Coincidencia por usuario (legacy)
                    if (reserva.usuario && reserva.usuario.toString() === userId.toString()) return true;
                    return false;
                });
                if (match && !turnoIdsSet.has(turno._id.toString())) {
                    turnosCliente.push(turno);
                    turnoIdsSet.add(turno._id.toString());
                }
            }

            return res.json({ ok: true, turnos: turnosCliente });
        }


    // Si el rol no es ninguno de los anteriores, no te dejamos pasar
    return res.status(403).json({ ok: false, msg: 'Rol no soportado' });

    } catch (error) {
        console.error('Error obtenerTurnosSegunRol', error);
        res.status(500).json({ ok: false, msg: 'Error al obtener turnos' });
    }
}

// Método para dar de baja lógica un turno (lo marca como inactivo)
// Usar desde el front: PUT /turnos/baja/:id
const bajaLogicaTurno = async (req, res) => {
    try {
        const turnoId = req.params.id;
        const turno = await Turno.findById(turnoId);
        if (!turno) return res.status(404).json({ ok: false, msg: 'Turno no encontrado' });

        if (!turno.activo) return res.status(400).json({ ok: false, msg: 'El turno ya está dado de baja' });

        turno.activo = false;
        await turno.save();
        return res.json({ ok: true, msg: 'Turno dado de baja correctamente' });
    } catch (error) {
        console.error('Error en bajaLogicaTurno', error);
        res.status(500).json({ ok: false, msg: 'No se pudo dar de baja el turno' });
    }
}

module.exports = {
    obtenerTurnosSegunRol,
    bajaLogicaTurno,
};
