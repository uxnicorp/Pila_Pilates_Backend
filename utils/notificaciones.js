/*
  Este módulo envía notificaciones push con OneSignal a los usuarios que tienen turno ese día.
  - Busca los turnos activos del día y sus reservas activas.
  - Para cada usuario con playerIds, envía un recordatorio personalizado.
  - Se ejecuta automáticamente todos los días a las 8 AM usando node-cron.
  - Requiere las variables ONESIGNAL_API_KEY y ONESIGNAL_APP_ID en el .env.
*/

const https = require('https');
const cron = require('node-cron');
const Turno = require('../models/Turno');

async function enviarRecordatoriosTurnosDelDia() {
  console.log('\n🔔 === INICIANDO ENVÍO DE NOTIFICACIONES DE TURNOS DEL DÍA ===');
  
  // Crear fecha en UTC para comparar correctamente con la BD
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth();
  const day = hoy.getDate();
  
  // Crear rango de fecha en UTC (inicio y fin del día en UTC)
  const inicioDelDia = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const finDelDia = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

  console.log(`📅 Buscando turnos para hoy: ${hoy.toLocaleDateString()}`);
  console.log(`🔍 Rango de búsqueda UTC: ${inicioDelDia.toISOString()} a ${finDelDia.toISOString()}`);

  // Primero veamos TODOS los turnos activos sin filtro de fecha
  const todosTurnos = await Turno.find({ activo: true });
  console.log(`📋 Total de turnos activos en BD: ${todosTurnos.length}`);
  
  if (todosTurnos.length > 0) {
    console.log('📋 Fechas de los turnos activos en BD:');
    todosTurnos.forEach(t => {
      console.log(`   - ${t.fecha.toISOString()} (${t.fecha.toLocaleDateString()}) - ${t.hora_inicio} - ${t.servicio}`);
    });
  }

  // Buscar turnos activos de hoy usando el rango UTC
  const turnos = await Turno.find({
    fecha: { $gte: inicioDelDia, $lte: finDelDia },
    activo: true
  }).populate({
    path: 'reservas',
    match: { estado: true },
    populate: { path: 'usuario', select: 'playerIds nombre apellido' }
  });

  console.log(`📊 Turnos encontrados para hoy: ${turnos.length}`);

  if (turnos.length === 0) {
    console.log('⚠️  No hay turnos activos para hoy. No se enviarán notificaciones.');
    return;
  }

  let notificacionesEnviadas = 0;
  let usuariosSinPlayerIds = 0;

  for (const turno of turnos) {
    console.log(`\n🎯 Procesando turno: ${turno.servicio} a las ${turno.hora_inicio}`);
    console.log(`   Reservas en este turno: ${turno.reservas ? turno.reservas.length : 0}`);
    
    if (!turno.reservas || turno.reservas.length === 0) {
      console.log('   ⚠️  No hay reservas activas en este turno');
      continue;
    }

    for (const reserva of turno.reservas) {
      const usuario = reserva.usuario;
      
      if (!usuario) {
        console.log('   ⚠️  Reserva sin usuario asociado');
        continue;
      }

      console.log(`   👤 Usuario: ${usuario.nombre} ${usuario.apellido}`);
      console.log(`   📱 PlayerIds: ${usuario.playerIds && usuario.playerIds.length > 0 ? usuario.playerIds.join(', ') : 'ninguno'}`);
      
      if (usuario && usuario.playerIds && usuario.playerIds.length > 0) {
        const mensaje = `Recordá tu clase de ${turno.servicio} hoy a las ${turno.hora_inicio} con ${turno.profesional.nombre} 🙌`;
        
        const payload = JSON.stringify({
          app_id: process.env.ONESIGNAL_APP_ID,
          include_player_ids: usuario.playerIds,
          contents: { en: mensaje, es: mensaje },
          headings: { en: 'PilaPilates', es: 'PilaPilates' },
          url: '/'
        });

        const options = {
          hostname: 'onesignal.com',
          port: 443,
          path: '/api/v1/notifications',
          method: 'POST',
          headers: {
            'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        try {
          const response = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
              let data = '';
              res.on('data', (chunk) => data += chunk);
              res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
          });
          
          console.log(`   ✅ Notificación enviada a ${usuario.nombre} ${usuario.apellido}`);
          notificacionesEnviadas++;
        } catch(err) {
          console.error(`   ❌ Error enviando notificación a ${usuario.nombre}:`, err.message);
        }
        
        // Pequeño delay para evitar saturar la API de OneSignal
        await new Promise(r => setTimeout(r, 200));
      } else {
        console.log(`   ⚠️  Usuario ${usuario.nombre} ${usuario.apellido} no tiene playerIds configurados`);
        usuariosSinPlayerIds++;
      }
    }
  }

  console.log('\n📊 === RESUMEN ===');
  console.log(`✅ Notificaciones enviadas: ${notificacionesEnviadas}`);
  console.log(`⚠️  Usuarios sin playerIds: ${usuariosSinPlayerIds}`);
  console.log('🔔 === FIN DEL ENVÍO DE NOTIFICACIONES ===\n');
}

// Ejecuta la función todos los días a las 8 AM
cron.schedule('0 8 * * *', () => {
  enviarRecordatoriosTurnosDelDia()
    .then(() => console.log('Notificaciones enviadas a los usuarios con turno hoy'))
    .catch(err => console.error('Error enviando notificaciones:', err));
});

// Función manual para enviar notificaciones a todos los usuarios con turnos hoy
async function enviarRecordatoriosTurnosDelDiaManual() {
  console.log('\n🚀 === ENVÍO MANUAL DE NOTIFICACIONES INICIADO ===');
  try {
    await enviarRecordatoriosTurnosDelDia();
    console.log('✅ === ENVÍO MANUAL COMPLETADO ===\n');
  } catch (err) {
    console.error('❌ Error en envío manual de notificaciones:', err);
  }
}

module.exports = {
  enviarRecordatoriosTurnosDelDia,
  enviarRecordatoriosTurnosDelDiaManual
};
