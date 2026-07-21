# Operations

1. Run `scripts/bootstrap.sh`, replace every placeholder in `.env`, then run `scripts/migrate.sh`.
2. Configure `OFFICIAL_SOURCE_HOSTS` to the authorized HTTPS source hosts and run `./start.sh`.
3. Demo data is opt-in: `CONFIRM_DEMO_SEED=yes scripts/seed-demo.sh` outside production only.

`/api/review-workflow` preserves source checksums, uncertainty, cases, signoffs, and audit events. Publication requires two independent bipartisan/nonpartisan approvals. The software rejects individual voter identifiers and unsupported fraud conclusions; it does not certify election data, anomaly baselines, findings, or legal/public statements.
