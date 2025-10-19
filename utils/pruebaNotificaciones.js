/*
  FUNCIÓN DE PRUEBA: Enviar notificación de test
  
  Esta función envía una notificación de prueba a todos los usuarios que tienen playerIds
  para verificar que el sistema de notificaciones funciona correctamente.
  
  Se ejecuta automáticamente 10 segundos después de iniciar el servidor.
*/

const https = require('https');
const Usuario = require('../models/Usuario');

async function enviarNotificacionDePrueba() {
  console.log('\n🧪 === INICIANDO PRUEBA DE NOTIFICACIONES ===\n');

  try {
    // Buscar usuarios que tengan playerIds
    const usuariosConNotificaciones = await Usuario.find({
      playerIds: { $exists: true, $ne: [] }
    }).select('nombre apellido email playerIds');

    console.log(`👥 Usuarios con notificaciones activas: ${usuariosConNotificaciones.length}`);

    if (usuariosConNotificaciones.length === 0) {
      console.log('⚠️  No hay usuarios con playerIds para enviar notificaciones de prueba');
      return;
    }

    // Recopilar todos los playerIds válidos (no vacíos)
    const todosLosPlayerIds = [];
    usuariosConNotificaciones.forEach(usuario => {
      console.log(`   - ${usuario.nombre} ${usuario.apellido} (${usuario.email})`);
      
      // Filtrar solo playerIds válidos (no vacíos y con formato UUID)
      const playerIdsValidos = usuario.playerIds.filter(id => id && id.trim().length > 0);
      
      if (playerIdsValidos.length > 0) {
        console.log(`     PlayerIds: ${playerIdsValidos.join(', ')}`);
        todosLosPlayerIds.push(...playerIdsValidos);
      } else {
        console.log(`     PlayerIds: (vacío - usuario no ha activado notificaciones)`);
      }
    });

    if (todosLosPlayerIds.length === 0) {
      console.log('⚠️  No hay playerIds válidos para enviar notificaciones');
      console.log('💡 Asegurate de que los usuarios hayan activado las notificaciones desde el botón en el panel');
      return;
    }

    console.log(`\n📤 Enviando notificación de prueba a ${todosLosPlayerIds.length} dispositivo(s)...\n`);

    // Preparar el payload
    const payload = JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      include_player_ids: todosLosPlayerIds,
      headings: { 
        en: '🧘 PilaPilates - Prueba de Notificación',
        es: '🧘 PilaPilates - Prueba de Notificación'
      },
      contents: { 
        en: '¡Perfecto! El sistema de notificaciones está funcionando correctamente. ¡Ya estás listo para recibir recordatorios de tus clases! 🎉',
        es: '¡Perfecto! El sistema de notificaciones está funcionando correctamente. ¡Ya estás listo para recibir recordatorios de tus clases! 🎉'
      },
      url: '/', // Redirige al home cuando hacen click
    });

    // Configurar la petición HTTPS
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

    // Enviar la petición
    const data = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(new Error('Error parseando respuesta de OneSignal'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(payload);
      req.end();
    });

    if (data.id) {
      console.log('✅ ¡Notificación de prueba enviada correctamente!');
      console.log(`   - Notification ID: ${data.id}`);
      console.log(`   - Recipients: ${data.recipients || todosLosPlayerIds.length}`);
      console.log('\n📱 Verificá tu navegador, deberías recibir la notificación en unos segundos...\n');
    } else if (data.errors) {
      console.log('❌ OneSignal devolvió errores:', data.errors);
    } else {
      console.log('⚠️  Respuesta inesperada de OneSignal:', data);
    }

  } catch (error) {
    console.error('❌ Error enviando notificación de prueba:', error.message);
    if (error.response) {
      const errorData = await error.response.text();
      console.error('📡 Respuesta de error:', errorData);
    }
  }

  console.log('🧪 === PRUEBA DE NOTIFICACIONES FINALIZADA ===\n');
}

module.exports = { enviarNotificacionDePrueba };
