const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiAuditLog = sequelize.define('AiAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  entity_type: {
    type: DataTypes.STRING(100)
  },
  entity_id: {
    type: DataTypes.INTEGER
  },
  model_used: {
    type: DataTypes.STRING(200)
  },
  action: {
    type: DataTypes.STRING(50),
    defaultValue: 'analyze'
  },
  metadata: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'ai_audit_logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = AiAuditLog;
