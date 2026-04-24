const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CampaignFinance = sequelize.define('CampaignFinance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  party: {
    type: DataTypes.STRING,
    allowNull: false
  },
  office: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalContributions: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  totalExpenditures: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  individualDonations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pacContributions: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  foreignFlaggedDonations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  largestSingleDonation: {
    type: DataTypes.DECIMAL(15, 2)
  },
  reportingPeriod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  complianceStatus: {
    type: DataTypes.ENUM('compliant', 'minor_violations', 'major_violations', 'under_audit', 'flagged'),
    defaultValue: 'compliant'
  },
  notes: {
    type: DataTypes.TEXT
  },
  aiAnalysis: {
    type: DataTypes.JSONB
  }
});

module.exports = CampaignFinance;
