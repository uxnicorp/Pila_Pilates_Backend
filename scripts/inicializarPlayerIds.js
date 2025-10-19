/*
  SCRIPT DE MIGRACIÓN: Inicializar playerIds en usuarios existentes
  
  ¿Qué hace este script?
  - Conecta a la base de datos MongoDB
  - Busca todos los usuarios que NO tienen el campo playerIds
  - Les agrega el campo playerIds como un array vacío []
  - Muestra cuántos usuarios fueron actualizados
  
  ¿Cómo ejecutarlo?
  Desde la terminal, en la carpeta del backend:
  node scripts/inicializarPlayerIds.js
  
  IMPORTANTE: Este script es seguro de ejecutar múltiples veces,
  solo actualizará usuarios que no tengan el campo playerIds.
*/

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a la base de datos
const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.DB_CNN);
    console.log('✅ Conectado a la base de datos');
    console.log(`📂 Base de datos: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ Error conectando a la DB:', error);
    process.exit(1);
  }
};

// Función principal
const inicializarPlayerIds = async () => {
  try {
    await conectarDB();

    // Importar el modelo de Usuario
    const Usuario = require('../models/Usuario');

    // Mostrar información de la colección
    const nombreColeccion = Usuario.collection.name;
    console.log(`📋 Colección: ${nombreColeccion}`);

    // Listar todas las colecciones disponibles
    const colecciones = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Colecciones en la base de datos:`);
    colecciones.forEach(col => console.log(`   - ${col.name}`));

    // Contar total de usuarios
    const totalUsuarios = await Usuario.countDocuments();
    console.log(`\n👥 Total de usuarios en la colección: ${totalUsuarios}`);

    // Mostrar algunos usuarios de ejemplo (solo campos relevantes)
    const usuariosEjemplo = await Usuario.find().limit(3).select('nombre apellido email playerIds');
    console.log(`\n📝 Ejemplo de usuarios (primeros 3):`);
    usuariosEjemplo.forEach(u => {
      console.log(`   - ${u.nombre} ${u.apellido} (${u.email})`);
      console.log(`     playerIds: ${u.playerIds ? JSON.stringify(u.playerIds) : 'NO EXISTE'}`);
    });

    // Buscar usuarios que no tienen el campo playerIds o está undefined
    const usuariosSinPlayerIds = await Usuario.countDocuments({
      $or: [
        { playerIds: { $exists: false } },
        { playerIds: null }
      ]
    });

    console.log(`\n📊 Usuarios sin playerIds encontrados: ${usuariosSinPlayerIds}`);

    if (usuariosSinPlayerIds === 0) {
      console.log('✨ Todos los usuarios ya tienen el campo playerIds inicializado.');
      process.exit(0);
    }

    // Actualizar todos los usuarios que no tienen playerIds
    const resultado = await Usuario.updateMany(
      {
        $or: [
          { playerIds: { $exists: false } },
          { playerIds: null }
        ]
      },
      {
        $set: { playerIds: [] }
      }
    );

    console.log(`\n✅ Migración completada:`);
    console.log(`   - Usuarios actualizados: ${resultado.modifiedCount}`);
    console.log(`   - Usuarios coincidentes: ${resultado.matchedCount}`);
    
    // Verificar el resultado
    const totalUsuariosFinal = await Usuario.countDocuments();
    const usuariosConPlayerIds = await Usuario.countDocuments({ 
      playerIds: { $exists: true } 
    });

    console.log(`\n📈 Estado final:`);
    console.log(`   - Total de usuarios: ${totalUsuariosFinal}`);
    console.log(`   - Usuarios con playerIds: ${usuariosConPlayerIds}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
};

// Ejecutar el script
inicializarPlayerIds();
