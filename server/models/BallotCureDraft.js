const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const metadata = require('./nativeRecordAttributes');
module.exports = sequelize.define('BallotCureDraft', {
  ...metadata,
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  county: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  voterBatch: { type: DataTypes.STRING, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  dueHours: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'draft' },
  notes: { type: DataTypes.TEXT, allowNull: true }
});
