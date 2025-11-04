import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

async function updateAdminPassword() {
  try {
    const password = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('New hash generated:', hash);
    
    // Update the admin user password
    const result = await query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
      [hash, 'admin@isacasv.org']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin password updated successfully for:', result.rows[0].email);
      console.log('You can now login with:');
      console.log('Email: admin@isacasv.org');
      console.log('Password: Admin@123');
    } else {
      console.log('❌ No admin user found with email: admin@isacasv.org');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();
