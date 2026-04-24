const sequelize = require('../config/database');
const User = require('./User');
const BallotCount = require('./BallotCount');
const Redistricting = require('./Redistricting');
const VoterRegistration = require('./VoterRegistration');
const CampaignFinance = require('./CampaignFinance');

module.exports = {
  sequelize,
  User,
  BallotCount,
  Redistricting,
  VoterRegistration,
  CampaignFinance
};
