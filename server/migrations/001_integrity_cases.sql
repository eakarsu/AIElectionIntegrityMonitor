BEGIN;
ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS jurisdiction_id TEXT;
CREATE TABLE IF NOT EXISTS integrity_cases (
 id BIGSERIAL PRIMARY KEY, jurisdiction_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('intake','triaged','in_review','returned','approved','dismissed','published')),
 signal JSONB NOT NULL, source_fingerprint CHAR(64) NOT NULL, version INTEGER NOT NULL DEFAULT 1,
 created_by TEXT NOT NULL, published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(jurisdiction_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS integrity_signoffs (
 id BIGSERIAL PRIMARY KEY, jurisdiction_id TEXT NOT NULL, case_id BIGINT NOT NULL REFERENCES integrity_cases(id), actor_id TEXT NOT NULL,
 party_affiliation TEXT NOT NULL CHECK(party_affiliation IN ('D','R','I','O','N')), decision TEXT NOT NULL CHECK(decision IN ('approve','return','dismiss')),
 rationale TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(case_id,actor_id)
);
CREATE TABLE IF NOT EXISTS integrity_events (
 id BIGSERIAL PRIMARY KEY,jurisdiction_id TEXT NOT NULL,case_id BIGINT NOT NULL REFERENCES integrity_cases(id),actor_id TEXT NOT NULL,event_type TEXT NOT NULL,
 details JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS integrity_source_sync (
 id BIGSERIAL PRIMARY KEY,jurisdiction_id TEXT NOT NULL,source TEXT NOT NULL,external_id TEXT NOT NULL,payload JSONB NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processed','failed','dead_letter')),attempts INTEGER NOT NULL DEFAULT 0,last_error TEXT,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(jurisdiction_id,source,external_id)
);
CREATE INDEX IF NOT EXISTS integrity_case_queue_idx ON integrity_cases(jurisdiction_id,status,updated_at DESC);
COMMIT;
