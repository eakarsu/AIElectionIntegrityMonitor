const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Bipartisan dual-review workflow: every Critical AI flag requires sign-off
 * from 2 reviewers of different party affiliations before record status changes.
 *
 * party_affiliation values: 'D' (Democrat), 'R' (Republican), 'I' (Independent),
 *                            'O' (Other), 'N' (None / non-partisan auditor).
 * For dual-key purposes the workflow checks distinct party_affiliation values
 * across pending sign-offs to satisfy the bipartisan requirement.
 */
const ReviewSignoff = sequelize.define('ReviewSignoff', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  entity_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reviewer_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  party_affiliation: {
    type: DataTypes.STRING(2),
    allowNull: false,
    comment: "D|R|I|O|N"
  },
  decision: {
    type: DataTypes.ENUM('approve', 'reject', 'escalate'),
    allowNull: false
  },
  ai_risk_level: {
    type: DataTypes.STRING(20)
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'review_signoffs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['reviewer_user_id'] }
  ]
});

module.exports = ReviewSignoff;
