// Explicit compatibility migration for the repository's pre-existing Sequelize models.
// This is intentionally not called by server startup.
const sequelize = require('../config/database');
require('../models');
sequelize.sync().then(() => sequelize.close()).catch((error) => { console.error(error); process.exitCode = 1; });
