import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

async function verifyAdminPassword() {
  try {
    // Get admin user from database
    const result = await query(
      'SELECT id, email, password FROM users WHERE email = $1',
      ['admin@isacasv.org']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    
    const admin = result.rows[0];
    const testPassword = 'Admin@123';
    
    console.log('Admin email:', admin.email);
    console.log('Testing password:', testPassword);
    console.log('Hash in DB:', admin.password);
    
    // Verify password
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    if (isMatch) {
      console.log('\n✅ Password verification: SUCCESS');
      console.log('\nYou can now login with:');
      console.log('Email: admin@isacasv.org');
      console.log('Password: Admin@123');
    } else {
      console.log('\n❌ Password verification: FAILED');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error verifying admin password:', error);
    process.exit(1);
  }
}

verifyAdminPassword();
