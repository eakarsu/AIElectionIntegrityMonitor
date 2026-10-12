const { DataTypes } = require('sequelize');
// Nullable scope preserves legacy rows without assigning them to a different jurisdiction.
module.exports = {
  jurisdiction_id: { type: DataTypes.TEXT, allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  is_demo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  demo_key: { type: DataTypes.TEXT, allowNull: true }
};
