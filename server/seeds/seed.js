const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const sequelize = require('../config/database');
const User = require('../models/User');
const BallotCount = require('../models/BallotCount');
const Redistricting = require('../models/Redistricting');
const VoterRegistration = require('../models/VoterRegistration');
const CampaignFinance = require('../models/CampaignFinance');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected for seeding...');

    await sequelize.sync({ force: true });
    console.log('Tables recreated.');

    // Seed Users
    await User.create({
      email: process.env.DEFAULT_EMAIL || 'admin@electionmonitor.gov',
      password: process.env.DEFAULT_PASSWORD || 'Admin123!',
      name: 'Admin User',
      role: 'admin'
    });
    await User.create({ email: 'auditor@electionmonitor.gov', password: 'Auditor123!', name: 'Jane Auditor', role: 'auditor' });
    await User.create({ email: 'viewer@electionmonitor.gov', password: 'Viewer123!', name: 'John Viewer', role: 'viewer' });
    console.log('Users seeded.');

    // Seed Ballot Counts (15 records)
    const ballotData = [
      { precinct: 'PCT-001', county: 'Maricopa', state: 'Arizona', electionDate: '2024-11-05', totalBallotsCast: 12450, registeredVoters: 18200, machineCount: 12450, handCount: 12448, discrepancy: 2, status: 'verified', notes: 'Minor discrepancy within acceptable range' },
      { precinct: 'PCT-042', county: 'Fulton', state: 'Georgia', electionDate: '2024-11-05', totalBallotsCast: 8920, registeredVoters: 11500, machineCount: 8920, handCount: 8915, discrepancy: 5, status: 'under_review', notes: 'Hand recount requested by observer' },
      { precinct: 'PCT-117', county: 'Wayne', state: 'Michigan', electionDate: '2024-11-05', totalBallotsCast: 15600, registeredVoters: 15100, machineCount: 15600, handCount: null, discrepancy: 0, status: 'flagged', notes: 'Turnout exceeds registered voters - URGENT' },
      { precinct: 'PCT-203', county: 'Philadelphia', state: 'Pennsylvania', electionDate: '2024-11-05', totalBallotsCast: 22100, registeredVoters: 31000, machineCount: 22100, handCount: 22098, discrepancy: 2, status: 'verified', notes: 'Normal urban precinct turnout' },
      { precinct: 'PCT-089', county: 'Clark', state: 'Nevada', electionDate: '2024-11-05', totalBallotsCast: 9800, registeredVoters: 14200, machineCount: 9800, handCount: 9780, discrepancy: 20, status: 'flagged', notes: 'Significant machine-hand count discrepancy' },
      { precinct: 'PCT-315', county: 'Dane', state: 'Wisconsin', electionDate: '2024-11-05', totalBallotsCast: 6700, registeredVoters: 9800, machineCount: 6700, handCount: 6699, discrepancy: 1, status: 'verified', notes: 'Routine verification complete' },
      { precinct: 'PCT-156', county: 'Allegheny', state: 'Pennsylvania', electionDate: '2024-11-05', totalBallotsCast: 11200, registeredVoters: 16500, machineCount: 11200, handCount: 11195, discrepancy: 5, status: 'pending', notes: 'Awaiting certification' },
      { precinct: 'PCT-078', county: 'Gwinnett', state: 'Georgia', electionDate: '2024-11-05', totalBallotsCast: 18500, registeredVoters: 24000, machineCount: 18500, handCount: 18490, discrepancy: 10, status: 'under_review', notes: 'Discrepancy under investigation' },
      { precinct: 'PCT-444', county: 'Washoe', state: 'Nevada', electionDate: '2024-11-05', totalBallotsCast: 4200, registeredVoters: 7600, machineCount: 4200, handCount: 4200, discrepancy: 0, status: 'verified', notes: 'Perfect match confirmed' },
      { precinct: 'PCT-221', county: 'Milwaukee', state: 'Wisconsin', electionDate: '2024-11-05', totalBallotsCast: 13800, registeredVoters: 19200, machineCount: 13800, handCount: 13790, discrepancy: 10, status: 'pending', notes: 'Review scheduled for next week' },
      { precinct: 'PCT-067', county: 'Pima', state: 'Arizona', electionDate: '2024-11-05', totalBallotsCast: 7500, registeredVoters: 12100, machineCount: 7500, handCount: 7495, discrepancy: 5, status: 'verified', notes: 'Within tolerance' },
      { precinct: 'PCT-190', county: 'Oakland', state: 'Michigan', electionDate: '2024-11-05', totalBallotsCast: 20100, registeredVoters: 28000, machineCount: 20100, handCount: 20085, discrepancy: 15, status: 'under_review', notes: 'Above average discrepancy for county' },
      { precinct: 'PCT-333', county: 'DeKalb', state: 'Georgia', electionDate: '2024-11-05', totalBallotsCast: 16400, registeredVoters: 21500, machineCount: 16400, handCount: 16395, discrepancy: 5, status: 'verified', notes: 'Certified by bipartisan board' },
      { precinct: 'PCT-501', county: 'Bucks', state: 'Pennsylvania', electionDate: '2024-11-05', totalBallotsCast: 9100, registeredVoters: 13800, machineCount: 9100, handCount: null, discrepancy: 0, status: 'pending', notes: 'Hand count not yet conducted' },
      { precinct: 'PCT-275', county: 'Mohave', state: 'Arizona', electionDate: '2024-11-05', totalBallotsCast: 3200, registeredVoters: 2900, machineCount: 3200, handCount: 3180, discrepancy: 20, status: 'flagged', notes: 'Turnout exceeds registration - potential same-day registrations or error' }
    ];
    await BallotCount.bulkCreate(ballotData);
    console.log('Ballot counts seeded (15 records).');

    // Seed Redistricting (15 records)
    const redistrictingData = [
      { districtName: 'TX-35 Proposed', state: 'Texas', proposedBy: 'State Legislature', population: 780125, minorityPopulationPct: 62.3, compactnessScore: 0.23, contiguityCheck: true, competitivenessIndex: 0.15, previousDistrictId: 'TX-35', proposalDate: '2024-03-15', status: 'flagged', fairnessScore: 3.2, notes: 'Extremely low compactness - potential gerrymandering' },
      { districtName: 'OH-15 Revision', state: 'Ohio', proposedBy: 'Independent Commission', population: 720450, minorityPopulationPct: 28.5, compactnessScore: 0.72, contiguityCheck: true, competitivenessIndex: 0.48, previousDistrictId: 'OH-15', proposalDate: '2024-04-01', status: 'approved', fairnessScore: 8.1, notes: 'Meets all fairness criteria' },
      { districtName: 'NC-12 Redraw', state: 'North Carolina', proposedBy: 'State Legislature', population: 745000, minorityPopulationPct: 45.8, compactnessScore: 0.31, contiguityCheck: true, competitivenessIndex: 0.12, previousDistrictId: 'NC-12', proposalDate: '2024-02-20', status: 'rejected', fairnessScore: 2.8, notes: 'Court ordered redraw - racial gerrymandering concerns' },
      { districtName: 'PA-7 Proposal', state: 'Pennsylvania', proposedBy: 'Citizens Committee', population: 710200, minorityPopulationPct: 35.2, compactnessScore: 0.65, contiguityCheck: true, competitivenessIndex: 0.52, previousDistrictId: 'PA-7', proposalDate: '2024-05-10', status: 'under_review', fairnessScore: 7.5, notes: 'Good community of interest preservation' },
      { districtName: 'GA-6 Redraw', state: 'Georgia', proposedBy: 'State Legislature', population: 755800, minorityPopulationPct: 51.2, compactnessScore: 0.45, contiguityCheck: true, competitivenessIndex: 0.22, previousDistrictId: 'GA-6', proposalDate: '2024-03-28', status: 'flagged', fairnessScore: 4.1, notes: 'Minority vote dilution concerns' },
      { districtName: 'MI-13 Update', state: 'Michigan', proposedBy: 'Independent Commission', population: 730100, minorityPopulationPct: 55.8, compactnessScore: 0.68, contiguityCheck: true, competitivenessIndex: 0.38, previousDistrictId: 'MI-13', proposalDate: '2024-04-15', status: 'approved', fairnessScore: 7.8, notes: 'Preserves minority representation' },
      { districtName: 'FL-5 Proposal', state: 'Florida', proposedBy: 'Governor Office', population: 769500, minorityPopulationPct: 47.3, compactnessScore: 0.28, contiguityCheck: false, competitivenessIndex: 0.18, previousDistrictId: 'FL-5', proposalDate: '2024-06-01', status: 'rejected', fairnessScore: 2.1, notes: 'Fails contiguity requirement' },
      { districtName: 'WI-3 Revision', state: 'Wisconsin', proposedBy: 'State Legislature', population: 725600, minorityPopulationPct: 18.5, compactnessScore: 0.58, contiguityCheck: true, competitivenessIndex: 0.35, previousDistrictId: 'WI-3', proposalDate: '2024-05-22', status: 'under_review', fairnessScore: 6.2, notes: 'Rural-urban split concerns' },
      { districtName: 'AZ-2 Redraw', state: 'Arizona', proposedBy: 'Independent Commission', population: 742300, minorityPopulationPct: 42.1, compactnessScore: 0.71, contiguityCheck: true, competitivenessIndex: 0.51, previousDistrictId: 'AZ-2', proposalDate: '2024-04-08', status: 'approved', fairnessScore: 8.5, notes: 'Highly competitive and fair' },
      { districtName: 'AL-7 Proposal', state: 'Alabama', proposedBy: 'State Legislature', population: 717800, minorityPopulationPct: 58.9, compactnessScore: 0.35, contiguityCheck: true, competitivenessIndex: 0.08, previousDistrictId: 'AL-7', proposalDate: '2024-06-15', status: 'flagged', fairnessScore: 3.5, notes: 'Packing concerns - excessive minority concentration' },
      { districtName: 'VA-4 Update', state: 'Virginia', proposedBy: 'Bipartisan Commission', population: 738500, minorityPopulationPct: 40.2, compactnessScore: 0.62, contiguityCheck: true, competitivenessIndex: 0.44, previousDistrictId: 'VA-4', proposalDate: '2024-03-05', status: 'approved', fairnessScore: 7.9, notes: 'Balanced demographic representation' },
      { districtName: 'IL-4 Redraw', state: 'Illinois', proposedBy: 'State Legislature', population: 750200, minorityPopulationPct: 72.5, compactnessScore: 0.18, contiguityCheck: true, competitivenessIndex: 0.05, previousDistrictId: 'IL-4', proposalDate: '2024-07-01', status: 'under_review', fairnessScore: 2.5, notes: 'Historic earmuff district - extreme shape' },
      { districtName: 'NV-4 Proposal', state: 'Nevada', proposedBy: 'Citizens Panel', population: 728900, minorityPopulationPct: 38.7, compactnessScore: 0.69, contiguityCheck: true, competitivenessIndex: 0.49, previousDistrictId: 'NV-4', proposalDate: '2024-05-18', status: 'proposed', fairnessScore: 7.6, notes: 'New district from population growth' },
      { districtName: 'LA-2 Revision', state: 'Louisiana', proposedBy: 'Federal Court', population: 760100, minorityPopulationPct: 56.3, compactnessScore: 0.52, contiguityCheck: true, competitivenessIndex: 0.28, previousDistrictId: 'LA-2', proposalDate: '2024-04-25', status: 'approved', fairnessScore: 6.8, notes: 'Court-mandated VRA compliance district' },
      { districtName: 'MD-3 Proposal', state: 'Maryland', proposedBy: 'State Legislature', population: 735400, minorityPopulationPct: 33.8, compactnessScore: 0.25, contiguityCheck: true, competitivenessIndex: 0.10, previousDistrictId: 'MD-3', proposalDate: '2024-08-01', status: 'flagged', fairnessScore: 3.0, notes: 'Highly irregular boundaries crossing multiple counties' }
    ];
    await Redistricting.bulkCreate(redistrictingData);
    console.log('Redistricting data seeded (15 records).');

    // Seed Voter Registration (15 records)
    const voterRegData = [
      { county: 'Maricopa', state: 'Arizona', registrationType: 'new', totalRegistrations: 45200, flaggedRecords: 890, duplicateRecords: 234, deceasedMatches: 12, addressMismatches: 456, reportDate: '2024-10-01', anomalyScore: 7.8, status: 'anomaly_detected', notes: 'Spike in registrations with PO box addresses' },
      { county: 'Harris', state: 'Texas', registrationType: 'new', totalRegistrations: 62100, flaggedRecords: 310, duplicateRecords: 89, deceasedMatches: 5, addressMismatches: 178, reportDate: '2024-10-01', anomalyScore: 2.1, status: 'clean', notes: 'Normal pre-election registration surge' },
      { county: 'Wayne', state: 'Michigan', registrationType: 'update', totalRegistrations: 28400, flaggedRecords: 1250, duplicateRecords: 567, deceasedMatches: 45, addressMismatches: 890, reportDate: '2024-09-15', anomalyScore: 9.2, status: 'under_investigation', notes: 'High rate of address changes to vacant lots' },
      { county: 'Fulton', state: 'Georgia', registrationType: 'purge', totalRegistrations: 15800, flaggedRecords: 2100, duplicateRecords: 0, deceasedMatches: 890, addressMismatches: 1200, reportDate: '2024-08-01', anomalyScore: 6.5, status: 'anomaly_detected', notes: 'Purge list accuracy under review' },
      { county: 'Philadelphia', state: 'Pennsylvania', registrationType: 'new', totalRegistrations: 38900, flaggedRecords: 420, duplicateRecords: 156, deceasedMatches: 8, addressMismatches: 234, reportDate: '2024-10-15', anomalyScore: 3.4, status: 'clean', notes: 'Consistent with historical patterns' },
      { county: 'Clark', state: 'Nevada', registrationType: 'transfer', totalRegistrations: 22300, flaggedRecords: 780, duplicateRecords: 345, deceasedMatches: 22, addressMismatches: 567, reportDate: '2024-09-01', anomalyScore: 8.1, status: 'anomaly_detected', notes: 'Bulk transfers from out of state' },
      { county: 'Dane', state: 'Wisconsin', registrationType: 'new', totalRegistrations: 18700, flaggedRecords: 95, duplicateRecords: 23, deceasedMatches: 2, addressMismatches: 45, reportDate: '2024-10-01', anomalyScore: 1.2, status: 'clean', notes: 'University area - expected student registrations' },
      { county: 'Cobb', state: 'Georgia', registrationType: 'update', totalRegistrations: 31200, flaggedRecords: 560, duplicateRecords: 189, deceasedMatches: 15, addressMismatches: 345, reportDate: '2024-09-20', anomalyScore: 5.5, status: 'anomaly_detected', notes: 'Name change requests above average' },
      { county: 'Allegheny', state: 'Pennsylvania', registrationType: 'reinstatement', totalRegistrations: 8900, flaggedRecords: 1200, duplicateRecords: 78, deceasedMatches: 34, addressMismatches: 890, reportDate: '2024-10-10', anomalyScore: 8.9, status: 'under_investigation', notes: 'Mass reinstatement of previously purged voters' },
      { county: 'Pima', state: 'Arizona', registrationType: 'new', totalRegistrations: 24500, flaggedRecords: 180, duplicateRecords: 45, deceasedMatches: 3, addressMismatches: 112, reportDate: '2024-10-05', anomalyScore: 2.8, status: 'clean', notes: 'Normal registration activity' },
      { county: 'Oakland', state: 'Michigan', registrationType: 'new', totalRegistrations: 35600, flaggedRecords: 210, duplicateRecords: 67, deceasedMatches: 7, addressMismatches: 156, reportDate: '2024-10-12', anomalyScore: 1.9, status: 'clean', notes: 'Suburban growth area' },
      { county: 'Milwaukee', state: 'Wisconsin', registrationType: 'purge', totalRegistrations: 12400, flaggedRecords: 3400, duplicateRecords: 0, deceasedMatches: 1200, addressMismatches: 2100, reportDate: '2024-07-01', anomalyScore: 7.2, status: 'anomaly_detected', notes: 'Aggressive purge - may remove eligible voters' },
      { county: 'Gwinnett', state: 'Georgia', registrationType: 'new', totalRegistrations: 41200, flaggedRecords: 890, duplicateRecords: 234, deceasedMatches: 11, addressMismatches: 456, reportDate: '2024-10-08', anomalyScore: 6.1, status: 'anomaly_detected', notes: 'Cluster of registrations from single address' },
      { county: 'Washoe', state: 'Nevada', registrationType: 'update', totalRegistrations: 15600, flaggedRecords: 120, duplicateRecords: 34, deceasedMatches: 4, addressMismatches: 78, reportDate: '2024-09-28', anomalyScore: 2.3, status: 'clean', notes: 'Routine address updates' },
      { county: 'Bucks', state: 'Pennsylvania', registrationType: 'new', totalRegistrations: 19800, flaggedRecords: 1500, duplicateRecords: 890, deceasedMatches: 56, addressMismatches: 678, reportDate: '2024-10-18', anomalyScore: 9.5, status: 'under_investigation', notes: 'Automated batch registration submissions detected' }
    ];
    await VoterRegistration.bulkCreate(voterRegData);
    console.log('Voter registration data seeded (15 records).');

    // Seed Campaign Finance (15 records)
    const campaignFinanceData = [
      { candidateName: 'Sarah Mitchell', party: 'Democratic', office: 'US Senate', state: 'Arizona', totalContributions: 12500000, totalExpenditures: 11800000, individualDonations: 45200, pacContributions: 3200000, foreignFlaggedDonations: 0, largestSingleDonation: 5800, reportingPeriod: 'Q3 2024', complianceStatus: 'compliant', notes: 'Clean record - full disclosure' },
      { candidateName: 'Robert Chen', party: 'Republican', office: 'US Senate', state: 'Nevada', totalContributions: 8900000, totalExpenditures: 9200000, individualDonations: 32100, pacContributions: 2800000, foreignFlaggedDonations: 3, largestSingleDonation: 25000, reportingPeriod: 'Q3 2024', complianceStatus: 'flagged', notes: 'Expenditures exceed contributions - potential unreported loans' },
      { candidateName: 'Maria Gonzalez', party: 'Democratic', office: 'US House', state: 'Texas', totalContributions: 3200000, totalExpenditures: 2900000, individualDonations: 18500, pacContributions: 800000, foreignFlaggedDonations: 0, largestSingleDonation: 2900, reportingPeriod: 'Q3 2024', complianceStatus: 'compliant', notes: 'Strong grassroots support' },
      { candidateName: 'James Wright', party: 'Republican', office: 'Governor', state: 'Georgia', totalContributions: 15800000, totalExpenditures: 14200000, individualDonations: 52300, pacContributions: 5600000, foreignFlaggedDonations: 12, largestSingleDonation: 50000, reportingPeriod: 'Q3 2024', complianceStatus: 'major_violations', notes: 'Multiple donations exceeding individual limits, foreign-linked PAC' },
      { candidateName: 'Lisa Park', party: 'Democratic', office: 'US House', state: 'Michigan', totalContributions: 2100000, totalExpenditures: 1950000, individualDonations: 12800, pacContributions: 450000, foreignFlaggedDonations: 0, largestSingleDonation: 2800, reportingPeriod: 'Q3 2024', complianceStatus: 'compliant', notes: 'First-time candidate - clean finances' },
      { candidateName: 'David Kowalski', party: 'Republican', office: 'US Senate', state: 'Pennsylvania', totalContributions: 18200000, totalExpenditures: 17500000, individualDonations: 67800, pacContributions: 7200000, foreignFlaggedDonations: 5, largestSingleDonation: 100000, reportingPeriod: 'Q3 2024', complianceStatus: 'under_audit', notes: 'Largest donation from LLC - shell company investigation' },
      { candidateName: 'Angela Davis-Brown', party: 'Democratic', office: 'Governor', state: 'Wisconsin', totalContributions: 9500000, totalExpenditures: 8800000, individualDonations: 38900, pacContributions: 2100000, foreignFlaggedDonations: 1, largestSingleDonation: 5000, reportingPeriod: 'Q3 2024', complianceStatus: 'minor_violations', notes: 'Late filing of quarterly report' },
      { candidateName: 'Thomas Reed', party: 'Republican', office: 'US House', state: 'Arizona', totalContributions: 4800000, totalExpenditures: 4500000, individualDonations: 21500, pacContributions: 1800000, foreignFlaggedDonations: 0, largestSingleDonation: 3500, reportingPeriod: 'Q3 2024', complianceStatus: 'compliant', notes: 'Incumbent - consistent donor base' },
      { candidateName: 'Nancy Yamamoto', party: 'Democratic', office: 'US Senate', state: 'Georgia', totalContributions: 11200000, totalExpenditures: 10800000, individualDonations: 49200, pacContributions: 3800000, foreignFlaggedDonations: 8, largestSingleDonation: 35000, reportingPeriod: 'Q3 2024', complianceStatus: 'flagged', notes: 'Crypto donations from untraceable wallets' },
      { candidateName: 'Marcus Johnson', party: 'Independent', office: 'US House', state: 'Nevada', totalContributions: 1500000, totalExpenditures: 1400000, individualDonations: 8900, pacContributions: 200000, foreignFlaggedDonations: 0, largestSingleDonation: 2500, reportingPeriod: 'Q3 2024', complianceStatus: 'compliant', notes: 'Small donor driven campaign' },
      { candidateName: 'Patricia Sullivan', party: 'Republican', office: 'Governor', state: 'Michigan', totalContributions: 22000000, totalExpenditures: 21500000, individualDonations: 78400, pacContributions: 9800000, foreignFlaggedDonations: 15, largestSingleDonation: 250000, reportingPeriod: 'Q3 2024', complianceStatus: 'major_violations', notes: 'Dark money PAC coordination suspected' },
      { candidateName: 'Carlos Ruiz', party: 'Democratic', office: 'US House', state: 'Pennsylvania', totalContributions: 2800000, totalExpenditures: 2650000, individualDonations: 15600, pacContributions: 650000, foreignFlaggedDonations: 0, largestSingleDonation: 2800, reportingPeriod: 'Q3 2024', complianceStatus: 'compliant', notes: 'Clean grassroots campaign' },
      { candidateName: 'Elizabeth Foster', party: 'Republican', office: 'US Senate', state: 'Wisconsin', totalContributions: 14500000, totalExpenditures: 13200000, individualDonations: 55600, pacContributions: 5200000, foreignFlaggedDonations: 2, largestSingleDonation: 10000, reportingPeriod: 'Q3 2024', complianceStatus: 'minor_violations', notes: 'Bundling disclosure incomplete' },
      { candidateName: 'Jerome Washington', party: 'Democratic', office: 'US House', state: 'Georgia', totalContributions: 3900000, totalExpenditures: 3700000, individualDonations: 22100, pacContributions: 900000, foreignFlaggedDonations: 0, largestSingleDonation: 3200, reportingPeriod: 'Q3 2024', complianceStatus: 'compliant', notes: 'Community-supported campaign' },
      { candidateName: 'Katherine O\'Brien', party: 'Republican', office: 'Governor', state: 'Nevada', totalContributions: 7800000, totalExpenditures: 8100000, individualDonations: 29800, pacContributions: 3100000, foreignFlaggedDonations: 7, largestSingleDonation: 75000, reportingPeriod: 'Q3 2024', complianceStatus: 'under_audit', notes: 'Casino industry donations under scrutiny' }
    ];
    await CampaignFinance.bulkCreate(campaignFinanceData);
    console.log('Campaign finance data seeded (15 records).');

    console.log('\n=== Seeding complete! ===');
    console.log('Default login: admin@electionmonitor.gov / Admin123!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
