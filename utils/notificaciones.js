/*
  Este módulo envía notificaciones push con OneSignal a los usuarios que tienen turno ese día.
  - Busca los turnos activos del día y sus reservas activas.
  - Para cada usuario con playerIds, envía un recordatorio personalizado.
  - Se ejecuta automáticamente todos los días a las 8 AM usando node-cron.
  - Requiere las variables ONESIGNAL_API_KEY y ONESIGNAL_APP_ID en el .env.
*/

const fetch = require('node-fetch');
const cron = require('node-cron');
const Turno = require('../models/Turno');

async function enviarRecordatoriosTurnosDelDia() {
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  // Buscar turnos activos de hoy
  const turnos = await Turno.find({
    fecha: { $gte: hoy, $lt: manana },
    activo: true
  }).populate({
    path: 'reservas',
    match: { estado: true },
    populate: { path: 'usuario', select: 'playerIds nombre apellido' }
  });

  for (const turno of turnos) {
    for (const reserva of turno.reservas) {
      const usuario = reserva.usuario;
      if (usuario && usuario.playerIds && usuario.playerIds.length > 0) {
        const mensaje = `Recordá tu clase de ${turno.servicio} hoy a las ${turno.hora_inicio} con ${turno.profesional.nombre} 🙌`;
        try {
          await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              app_id: process.env.ONESIGNAL_APP_ID,
              include_player_ids: usuario.playerIds,
              contents: { en: mensaje },
              headings: { en: 'PipaPilates' },
              url: '/'
            })
          });
        } catch(err) {
          console.error(`Error enviando notificación a ${usuario.nombre}:`, err);
        }
        // Pequeño delay para evitar saturar la API de OneSignal
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }
}

// Ejecuta la función todos los días a las 8 AM
cron.schedule('0 8 * * *', () => {
  enviarRecordatoriosTurnosDelDia()
    .then(() => console.log('Notificaciones enviadas a los usuarios con turno hoy'))
    .catch(err => console.error('Error enviando notificaciones:', err));
});

module.exports = { enviarRecordatoriosTurnosDelDia };
