const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BallotCount = sequelize.define('BallotCount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  precinct: {
    type: DataTypes.STRING,
    allowNull: false
  },
  county: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  electionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  totalBallotsCast: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  registeredVoters: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  machineCount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  handCount: {
    type: DataTypes.INTEGER
  },
  discrepancy: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('verified', 'pending', 'flagged', 'under_review'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT
  },
  aiAnalysis: {
    type: DataTypes.JSONB
  }
});

module.exports = BallotCount;
