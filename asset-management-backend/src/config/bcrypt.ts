import dotenv from 'dotenv';

dotenv.config();

interface BcryptConfig {
  saltRounds: number;
}

const bcryptConfig: BcryptConfig = {
  saltRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
};

// Validate bcrypt rounds
if (bcryptConfig.saltRounds < 10 || bcryptConfig.saltRounds > 15) {
  console.warn('⚠️  bcrypt saltRounds should be between 10-15 for optimal security and performance');
}

export default bcryptConfig;
