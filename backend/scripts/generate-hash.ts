// Script pour générer le hash bcrypt de "password123"
import bcrypt from 'bcrypt';

const password = 'password123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nUtilisez ce hash dans init.sql');
  }
});
