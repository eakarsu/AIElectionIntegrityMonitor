const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VoterRegistration = sequelize.define('VoterRegistration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  county: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  registrationType: {
    type: DataTypes.ENUM('new', 'update', 'transfer', 'purge', 'reinstatement'),
    allowNull: false
  },
  totalRegistrations: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  flaggedRecords: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  duplicateRecords: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  deceasedMatches: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  addressMismatches: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reportDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  anomalyScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('clean', 'anomaly_detected', 'under_investigation', 'resolved'),
    defaultValue: 'clean'
  },
  notes: {
    type: DataTypes.TEXT
  },
  aiAnalysis: {
    type: DataTypes.JSONB
  }
});

module.exports = VoterRegistration;
