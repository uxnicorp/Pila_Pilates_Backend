const Turno = require('../models/Turno');
const Usuario = require('../models/Usuario'); // Para validar y obtener datos del profesional


//funcion para traer todos los usuarios 'empleados' de la base de datos
//datos : _id, nombre y apellido
const obtenerEmpleados = async (req, res) => {
    try {
        // 1. Buscar ONLY empleados en la BD, seleccionando solo los campos necesarios
        const empleados = await Usuario.find(
            { rol: 'empleado' }, // Filtro
            'nombre apellido _id' // Campos a devolver (Proyección)
        ).sort({ nombre: 1 }); // Orden alfabético por nombre

        // 2. Enviar la respuesta
        res.json({
            ok: true,
            empleados
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener la lista de empleados. Por favor, contacte al administrador.'
        });
    }
};

//funcion para crear turnos disponibles
//NOTA: espera un arreglo de fecha spara crear turnos en varias fechas
const crearTurnosEnLote = async (req, res) => {
    const { turnos } = req.body;

    try {
        if (!Array.isArray(turnos) || turnos.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Se debe proporcionar un array de turnos válido'
            });
        }

        // VALIDACIÓN MEJORADA: Verificar campos requeridos
        for (const turno of turnos) {
            if (!turno.fecha || !turno.hora_inicio || !turno.hora_fin || !turno.profesional) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Cada turno debe tener fecha, hora_inicio, hora_fin y profesional'
                });
            }
            
            // VALIDACIÓN MEJORADA del profesional
            if (!turno.profesional.id && !turno.profesional._id) {
                return res.status(400).json({
                    ok: false,
                    msg: 'El profesional debe tener un ID válido'
                });
            }

            if (!turno.profesional.nombre || !turno.profesional.apellido) {
                return res.status(400).json({
                    ok: false,
                    msg: 'El profesional debe tener nombre y apellido'
                });
            }
        }

        // PREPARAR DATOS CORREGIDO
        const turnosACrear = turnos.map(turnoData => {
            // CORRECCIÓN PRINCIPAL: Manejar tanto _id como id
            const profesionalId = turnoData.profesional._id || turnoData.profesional.id;
            
            if (!profesionalId) {
                throw new Error('ID de profesional no encontrado');
            }

            return {
                fecha: new Date(turnoData.fecha),
                hora_inicio: turnoData.hora_inicio,
                hora_fin: turnoData.hora_fin,
                servicio: turnoData.servicio || "Pilates",
                cupo_maximo: turnoData.cupo_maximo || 5,
                profesional: {
                    id: profesionalId, // ← CORREGIDO
                    nombre: turnoData.profesional.nombre,
                    apellido: turnoData.profesional.apellido
                },
                reservas: []
            };
        });

        // OPERACIÓN ÚNICA EN LA BD
        const turnosCreados = await Turno.insertMany(turnosACrear);

        res.status(201).json({
            ok: true,
            msg: `Se crearon ${turnosCreados.length} turnos exitosamente`,
            turnos: turnosCreados
        });

    } catch (error) {
        console.error('Error en crearTurnosEnLote:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                msg: 'Uno o más turnos ya existen para esa fecha y hora.'
            });
        }

        res.status(500).json({
            ok: false,
            msg: 'Error inesperado al crear turnos: ' + error.message
        });
    }
};

const cargarTurnos = async (req, res) => {

    try {

        //el find sirve para recorrer en la base de dato todos los productos llevandose des esquema importado
        const turnos = await Turno.find();

        res.status(200).json({
            ok: true,
            msg: "turnos cargados",
            turnos,

        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "contactese con el administrador",
        })
    }

};

module.exports = {
    obtenerEmpleados,
    crearTurnosEnLote,
    cargarTurnos

};