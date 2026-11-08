# NEXT ACTION — post-PHASE-030

PHASE-030 (Wholesale & Electronics Templates) is COMPLETE, and the honestly
deferred PHASE-029 (Payroll) planning-docs flip is delivered with this docs
wave (commit `9b251a0` shipped the code; the reports landed here).
CURRENT_SHIPPED_PHASE = "PHASE-030" (migration 0041, schema_version 41;
9 shipped industry templates; report registry 81 contracts; permissions
245=245; i18n 4,069=4,069 — zero web changes in 030; see the completion
reports §3 for the T8 final-sweep numbers).

**Next eligible: PHASE-031 (Healthcare Commercial Shell, ED-07)** — per
EXPANSION_REGISTER §B sequencing: 031 needs 015 (the engine), 010 (pharmacy
batches), 012 (AR), 019 (service orders), and 027 (claims via notes) COMPLETE
— all are (identify only; do not implement without a fresh phase order). Then
032/033 (education, agriculture shells) and PHASE-034 (consolidation — the
Enterprise Depth gate).

Key handoffs from 030 (read the PHASE-030 completion report first):
- The **capability-matrix reconciliation harness**
  (`capability-matrix-reconciliation.spec.ts`) is the durable artifact 031/032/
  033 extend: add the HLT/EDU/AGR column mappings + strict legs when each shell
  ships. Shrinking KNOWN_DELTA (or KNOWN_PRE030_UNRESOLVED_PINS) is a REVIEWED
  registry-hygiene change per template's owning phase — never a silent edit;
  growing either fails CI by construction.
- The **report-pack wiring gate** (`report-pack-wiring.spec.ts`) runs for every
  future template phase: every pin must resolve in the LIVE registry before
  apply (the `inventory.stock_valuation` doc-spelling family is exactly what
  it catches).
- The **templates-NNN spec pattern** (governance battery + idempotent re-apply +
  switch safety + degraded entitlement + the negative ledger proof) is the
  template for 031/032/033; the phase doc's workflow-smoke and RTL-visual
  carve-outs are recorded honestly in the 030 report §6.6 — decide per shell
  whether the §8 letter gets its own smoke specs.
- Phase-gating state: nothing phase-gates past PHASE-027 in any shipped
  manifest (the prerequisites comment chain records it); the synthetic
  mechanism proof now gates on `healthcare.patients`@PHASE-031 — 031's own
  first consumer.
- Watch items carried: SF-026-001 (purge vs guards), SF-026-002 (RC-10 seeded
  drift DB proof), the 028 ControlGuard first production call-site, the 029
  "E2" item + payslip print-template deferrals, and the environmental runbook
  note (ga-full-load / report-hammer / notifications-email want dedicated
  small-chunk runs on slow boxes).
