const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Redistricting = sequelize.define('Redistricting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  districtName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  proposedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  population: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  minorityPopulationPct: {
    type: DataTypes.FLOAT
  },
  compactnessScore: {
    type: DataTypes.FLOAT
  },
  contiguityCheck: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  competitivenessIndex: {
    type: DataTypes.FLOAT
  },
  previousDistrictId: {
    type: DataTypes.STRING
  },
  proposalDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('proposed', 'under_review', 'approved', 'rejected', 'flagged'),
    defaultValue: 'proposed'
  },
  fairnessScore: {
    type: DataTypes.FLOAT
  },
  notes: {
    type: DataTypes.TEXT
  },
  aiAnalysis: {
    type: DataTypes.JSONB
  }
});

module.exports = Redistricting;
