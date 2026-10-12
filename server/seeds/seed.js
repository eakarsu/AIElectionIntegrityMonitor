// Explicit additive seed for existing accounts; never recreate tables or users.
const path = require('path');
require('dotenv').config({path:path.join(__dirname,'../../.env')});
const fs = require('fs');
const sequelize = require('../config/database');
const User = require('../models/User');
const { seedDemoRecords,inspectDemoRecords } = require('../services/demoRecords');
async function main(args=process.argv.slice(2)) {
  if(process.env.NODE_ENV==='production')throw new Error('Fictional demo seeding is disabled in production');
  const value=flag=>args[args.indexOf(flag)+1];
  const userId=args.includes('--user-id')?Number(value('--user-id')):null;
  const email=args.includes('--email')?value('--email'):null;
  if(!userId&&!email)throw new Error('Specify an existing target --user-id or --email; no account will be created or reset');
  const actor=userId?await User.findByPk(userId):await User.findOne({where:{email}});
  if(!actor)throw new Error('Target account must already exist');
  if(args.includes('--migrate'))await sequelize.query(fs.readFileSync(path.join(__dirname,'../migrations/002_readable_domain_records.sql'),'utf8'));
  const result=args.includes('--dry-run')?{dryRun:true,actorId:actor.id,before:await inspectDemoRecords(actor)}:await seedDemoRecords({userId:actor.id,expectedEmail:actor.email,count:args.includes('--count')?Number(value('--count')):15});
  console.log(JSON.stringify(result));return result;
}
if(require.main===module)main().catch(()=>{console.error('Seed failed. Check the existing account, native migration and requested count. No account was reset.');process.exitCode=1;}).finally(()=>sequelize.close());
module.exports={main};
