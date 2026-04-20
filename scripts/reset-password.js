const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

async function resetPassword() {
  const [,, email, newPassword] = process.argv;

  if (!email || !newPassword) {
    console.error('\n❌ Error: Faltan argumentos.');
    console.log('Uso: npm run reset-password <email> <nueva_contraseña>\n');
    process.exit(1);
  }

  const dbPath = path.join(__dirname, '../shorten.db');
  
  if (!fs.existsSync(dbPath)) {
    console.error(`\n❌ Error: No se encontró la base de datos en ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath);

  try {
    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (!user) {
      console.error(`\n❌ Error: No se encontró ningún usuario con el email: ${email}\n`);
      process.exit(1);
    }

    // Hash the new password
    console.log(`\n⏳ Hasheando nueva contraseña para ${email}...`);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Update the database
    const result = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);

    if (result.changes > 0) {
      console.log(`\n✅ ¡Éxito! La contraseña de ${email} ha sido actualizada.`);
      console.log(`Ahora puedes iniciar sesión con tu nueva contraseña.\n`);
    } else {
      console.log('\n⚠️ No se realizaron cambios en la base de datos.\n');
    }

  } catch (err) {
    console.error('\n❌ Error al resetear la contraseña:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

resetPassword();
