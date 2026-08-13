// Run with: npm run seed:admin
// Creates (or updates) the initial Admin account from env vars,
// since the API deliberately has no "create admin" endpoint.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  await connectDB();

  const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;

  if (!SEED_ADMIN_NAME || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    console.error('SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const existing = await User.findOne({ email: SEED_ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log(`Admin account already exists for ${SEED_ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL.toLowerCase(),
      password: SEED_ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`Admin account created for ${SEED_ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
