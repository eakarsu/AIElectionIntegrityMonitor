BEGIN;
-- Add scope/sample metadata only. Original IDs, facts and approvals remain unchanged.
ALTER TABLE "BallotCounts" ADD COLUMN IF NOT EXISTS jurisdiction_id TEXT;
ALTER TABLE "BallotCounts" ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES "Users"(id);
ALTER TABLE "BallotCounts" ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "BallotCounts" ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE "VoterRegistrations" ADD COLUMN IF NOT EXISTS jurisdiction_id TEXT;
ALTER TABLE "VoterRegistrations" ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES "Users"(id);
ALTER TABLE "VoterRegistrations" ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "VoterRegistrations" ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE "CampaignFinances" ADD COLUMN IF NOT EXISTS jurisdiction_id TEXT;
ALTER TABLE "CampaignFinances" ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES "Users"(id);
ALTER TABLE "CampaignFinances" ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "CampaignFinances" ADD COLUMN IF NOT EXISTS demo_key TEXT;
ALTER TABLE "Redistrictings" ADD COLUMN IF NOT EXISTS jurisdiction_id TEXT;
ALTER TABLE "Redistrictings" ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES "Users"(id);
ALTER TABLE "Redistrictings" ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Redistrictings" ADD COLUMN IF NOT EXISTS demo_key TEXT;
CREATE TABLE IF NOT EXISTS "BallotCureDrafts" (
 id SERIAL PRIMARY KEY,
 jurisdiction_id TEXT NOT NULL, created_by INTEGER REFERENCES "Users"(id),
 is_demo BOOLEAN NOT NULL DEFAULT FALSE, demo_key TEXT,
 county VARCHAR(255) NOT NULL, state VARCHAR(255) NOT NULL,
 "voterBatch" VARCHAR(255) NOT NULL, reason TEXT NOT NULL,
 "dueHours" INTEGER, status VARCHAR(255) NOT NULL DEFAULT 'draft', notes TEXT,
 "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS election_ballot_demo_key ON "BallotCounts"(jurisdiction_id,demo_key) WHERE demo_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS election_voter_demo_key ON "VoterRegistrations"(jurisdiction_id,demo_key) WHERE demo_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS election_finance_demo_key ON "CampaignFinances"(jurisdiction_id,demo_key) WHERE demo_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS election_district_demo_key ON "Redistrictings"(jurisdiction_id,demo_key) WHERE demo_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS election_cure_demo_key ON "BallotCureDrafts"(jurisdiction_id,demo_key) WHERE demo_key IS NOT NULL;
COMMIT;
