'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');

async function main() {
  if (!['1', 'true'].includes(String(process.env.ALLOW_SCHEMA_MIGRATION || '').toLowerCase())) throw new Error('Explicit schema authorization is required');
  const email = (process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  const name = (process.env.PROVISION_ADMIN_NAME || 'Runtime Administrator').trim();
  if (!email || password.length < 12) throw new Error('Admin email and a 12+ character password are required');
  let user = await User.findOne({ where: { email } });
  if (!user) {
    user = await User.create({ email, password, name, role: 'admin' });
  } else {
    await user.update({ password: await bcrypt.hash(password, 12), name, role: 'admin' });
  }
}

main().then(() => sequelize.close()).catch(async (error) => { console.error(error.message); await sequelize.close().catch(() => {}); process.exit(1); });
