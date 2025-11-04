import bcrypt from 'bcryptjs';

const password = 'Admin@123';
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);

console.log('Password:', password);
console.log('Bcrypt Hash:', hash);
