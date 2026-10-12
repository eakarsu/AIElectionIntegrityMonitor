const { collections, recordScope, scopeWhere } = require('./nativeRecords');
const User = require('../models/User');
const sequelize = require('../config/database');
const places = [['CA','Los Angeles',2024], ['TX','Travis',2026], ['FL','Miami-Dade',2028]];
function fictionalRecord(collection,index,actor) {
  const [state,county,year] = places[(index-1)%3];
  const tag = String(index).padStart(2,'0');
  const common = { jurisdiction_id: recordScope(actor), created_by: actor.id, is_demo: true, demo_key: 'fictional-v1-'+tag,
    notes: 'FICTIONAL TRAINING SAMPLE. Unreviewed illustrative values; no real voter, election result, funding allegation, certification or outreach.' };
  if (collection === 'ballot-counts') return { ...common, precinct: 'DEMO-PCT-'+tag, county, state, electionDate: year+'-11-05', totalBallotsCast: 600+index*10, registeredVoters: 1000+index*20, machineCount: 600+index*10, handCount: null, discrepancy: 0, status: 'pending', aiAnalysis: null };
  if (collection === 'voter-registration') return { ...common, county, state, registrationType: ['new','update','purge'][(index-1)%3], totalRegistrations: 50+index, flaggedRecords: 0, duplicateRecords: 0, deceasedMatches: 0, addressMismatches: 0, reportDate: year+'-10-01', anomalyScore: 0, status: 'under_investigation', aiAnalysis: null };
  if (collection === 'campaign-finance') return { ...common, candidateName: 'Demo Candidate '+tag, party: 'Fictional training slate', office: 'Illustrative local office', state, totalContributions: 1000+index*50, totalExpenditures: 500+index*25, individualDonations: 10+index, pacContributions: 0, foreignFlaggedDonations: 0, largestSingleDonation: 50, reportingPeriod: 'Demo Q3 '+year, complianceStatus: 'under_audit', aiAnalysis: null };
  if (collection === 'redistricting') return { ...common, districtName: 'Demo District '+tag, state, proposedBy: 'Fictional planning team', population: 10000+index*100, minorityPopulationPct: null, compactnessScore: null, contiguityCheck: null, competitivenessIndex: null, previousDistrictId: null, proposalDate: year+'-01-15', status: 'proposed', fairnessScore: null, aiAnalysis: null };
  return { ...common, county, state, voterBatch: 'DEMO-BATCH-'+tag, reason: 'Illustrative missing-document exercise; no actual voter case', dueHours: null, status: 'draft' };
}
async function inspectDemoRecords(actor,{models=collections,transaction}={}) {
  const rows={};
  for(const [name,model] of Object.entries(models)) rows[name]=await model.count({where:scopeWhere(actor),transaction});
  return rows;
}
async function seedDemoRecords({userId,count=15,expectedEmail,database=sequelize,models=collections,userModel=User,signal}={}) {
  if (!Number.isInteger(count)||count<15||count>100) throw new Error('count must be an integer from 15 to 100');
  return database.transaction(async transaction=>{
    const check=()=>{if(signal?.aborted)throw Object.assign(new Error('Demo seed cancelled'),{name:'AbortError'});};check();
    const actor=await userModel.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});
    if(!actor||expectedEmail&&actor.email!==expectedEmail) throw new Error('An existing target account with matching identity is required');
    await database.query('SELECT pg_advisory_xact_lock(hashtext(:scope))',{replacements:{scope:'election-demo-'+recordScope(actor)},transaction});
    const before=await inspectDemoRecords(actor,{models,transaction}),added={};
    for(const [collection,model] of Object.entries(models)) {
      added[collection]=0;let total=before[collection];
      for(let index=1;total<count&&index<=count*2;index++) {
        check();const record=fictionalRecord(collection,index,actor);
        const existing=await model.findOne({where:{jurisdiction_id:recordScope(actor),demo_key:record.demo_key},transaction});
        if(existing)continue;
        await model.create(record,{transaction});added[collection]++;total++;
      }
    }
    check();return { before,added,after:await inspectDemoRecords(actor,{models,transaction}), actorId:actor.id, fictional:true, preservedUsers:true };
  });
}
module.exports={fictionalRecord,inspectDemoRecords,seedDemoRecords};
