if (process.env.CONFIRM_DEMO_SEED !== 'yes' || process.env.NODE_ENV === 'production') {
  console.error('Demo seed refused: set CONFIRM_DEMO_SEED=yes outside production.');
  process.exit(1);
}
const {main}=require('../seeds/seed');
const database=require('../config/database');
main().catch(()=>{console.error('Additive seed failed; inspect the existing actor and native migration.');process.exitCode=1;}).finally(()=>database.close());
