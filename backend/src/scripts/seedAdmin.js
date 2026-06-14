/**
 * seedAdmin.js
 * Run once to create the admin account in MongoDB.
 *
 * Usage:
 *   SEED_ADMIN_PASSWORD=yourpassword node src/scripts/seedAdmin.js
 *
 * Re-run any time to reset the admin password.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || 'Admin';
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@rentride.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || null;

async function seed() {
  if (!ADMIN_PASSWORD) {
    console.error('\n❌  SEED_ADMIN_PASSWORD env variable is not set.');
    console.error('    Run: SEED_ADMIN_PASSWORD=yourpassword node src/scripts/seedAdmin.js\n');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error('❌  Password must be at least 8 characters.\n');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    existing.name     = ADMIN_NAME;
    existing.role     = 'admin';
    existing.password = ADMIN_PASSWORD;
    await existing.save();
    console.log(`✅  Admin account updated: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role:     'admin',
    });
    console.log(`✅  Admin account created: ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
  console.log('✅  Done.\n');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});