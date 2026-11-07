# NEXT ACTION — post-PHASE-028

PHASE-028 (Budgeting & Variance Control) is COMPLETE and committed.
CURRENT_SHIPPED_PHASE = "PHASE-028" (migration 0039, schema_version 39;
registry 78 contracts; permissions 245=245 — §3.13 was pre-seeded; i18n
3,914=3,914; DB suite 153/156 files green — the 3 failures are the
documented environmental set; see the completion report §3).

**Next eligible: PHASE-029 (Payroll & EOS, DR-005)** — the last remaining
stage-9 sibling, then PHASE-034 (consolidation) per EXPANSION_REGISTER §B
(identify only; do not implement without a fresh phase order).

Key handoffs from 028 (read the PHASE-028 completion report first):
- The negative-ledger-proof pattern (journal-count snapshots + engine spy +
  the structural grep) is THE template for every future planning-layer
  module — DR-004's "structurally ledger-incapable" made testable.
- The BRANCHES-dimension precedent: journal lines carry no branch — actuals
  derive branches through the entry's SOURCE document (LATERAL fold, honest
  NULL bucket). Any future dimension over the GL must state its attribution
  story the same way.
- Watch items carried: SF-026-001 (purge vs guards), SF-026-002 (RC-10
  accum sign seeded-drift DB proof), SF-028-001 (recorded+corrected docs
  drift — no action). New recommended follow-up: wire the FIRST production
  ControlGuard call-site (treasury expense DRAFT-save is the natural
  surface) — a small audited patch, honest to record in its phase report.
- Runbook note (extended): ga-full-load + report-hammer want dedicated
  small-chunk runs on slow boxes — report-hammer's deliberate
  concurrent-identical-upsert contention exceeds the 15s statement timeout
  when the machine is ~5-10× slower than the 025 measurement box; both
  measured green standalone on the reference environment.
