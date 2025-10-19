const express = require('express');
const { dbConeccion } = require('./dataBase/confing');
require('dotenv').config()
const cors= require("cors");
const app= express();

// Activa el sistema de notificaciones push diarias (OneSignal)
const { enviarRecordatoriosTurnosDelDia, enviarRecordatoriosTurnosDelDiaManual } = require('./utils/notificaciones');
// Activa el sistema de notificaciones push diarias (OneSignal)
require('./utils/notificaciones');

// Función de prueba de notificaciones
const { enviarNotificacionDePrueba } = require('./utils/pruebaNotificaciones');

//llamar al servidor

app.listen(process.env.PORT, ()=>{
        console.log(`server corriendo en ${process.env.PORT}`)

        // Enviar notificación de prueba después de 10 segundos
        console.log('⏰ Notificación de prueba programada para enviarse en 10 segundos...');
        setTimeout(() => {
                
                // Enviar notificaciones manuales a todos los usuarios con turnos hoy
                enviarRecordatoriosTurnosDelDiaManual()
                    .then(() => console.log('✅ Notificaciones manuales de turnos del día enviadas (inicio servidor)'))
                    .catch(err => console.error('❌ Error enviando notificaciones manuales de turnos del día:', err));
        }, 10000);
});

    //base de datos
dbConeccion();

//cors
app.use(cors());

//directorio publico
app.use(express.static('public'));

//lectura y parseo del body
app.use(express.json());

//midelwars son procesos que se van a correr durante la ejecucion
app.use("/auth",require('./rutes/auth'))

//para el admin
app.use("/admin",require('./rutes/admin'))

// rutas de turnos (mis turnos segun rol)


app.use('/api/usuarios', require('./rutes/usuario'))
app.use('/reserva', require('./rutes/reserva'))
app.use('/turnos', require('./rutes/turnos'))

