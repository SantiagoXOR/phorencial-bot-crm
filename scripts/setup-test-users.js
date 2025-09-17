/**
 * Script para crear usuarios de test en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aozysydpwvkkdvhfsvsu.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvenlzeWRwd3Zra2R2aGZzdnN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNDk4NCwiZXhwIjoyMDcxMzkwOTg0fQ.S0VZQD26wTUcoTeo9ZSqoO0JbQq1zvP_uT0LZsXmCPw';

const supabase = createClient(supabaseUrl, serviceKey);

const TEST_USERS = [
  {
    email: 'admin@phorencial.com',
    password: 'admin123',
    role: 'ADMIN',
    name: 'Admin'
  },
  {
    email: 'ludmila@phorencial.com',
    password: 'ludmila123',
    role: 'ANALISTA',
    name: 'Ludmila'
  },
  {
    email: 'vendedor@phorencial.com',
    password: 'vendedor123',
    role: 'VENDEDOR',
    name: 'Vendedor Demo'
  }
];

async function setupTestUsers() {
  console.log('🚀 Configurando usuarios de test...');

  for (const user of TEST_USERS) {
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('User')
        .select('id, email')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        console.log(`✅ Usuario ${user.email} ya existe`);
        continue;
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Crear el usuario
      const { data: newUser, error } = await supabase
        .from('User')
        .insert({
          email: user.email,
          password: hashedPassword,
          role: user.role,
          name: user.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creando usuario ${user.email}:`, error);
      } else {
        console.log(`✅ Usuario ${user.email} creado exitosamente`);
      }

    } catch (error) {
      console.error(`❌ Error procesando usuario ${user.email}:`, error);
    }
  }

  console.log('✅ Configuración de usuarios de test completada');
}

// Ejecutar el script
setupTestUsers().catch(console.error);
