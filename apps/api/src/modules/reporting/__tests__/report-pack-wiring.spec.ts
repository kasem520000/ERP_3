import { describe, expect, it } from "vitest";

import {
  ELECTRONICS_TEMPLATE_MANIFEST,
  RETAIL_MANIFEST,
  GROCERY_MANIFEST,
  WHOLESALE_TEMPLATE_MANIFEST,
} from "@erp/contracts";

import { REPORT_CONTRACTS } from "../registry";

/**
 * PHASE-030 T10 — the report-pack wiring gate (industries/reports/README
 * v2.0 mapping; register §J stays closed for 030):
 *
 * every report pin the two new templates ship resolves against the LIVE
 * report-contract registry — wholesale (notes.maturity-calendar,
 * notes.aging, ar.aging, inventory.valuation) and electronics
 * (retail.imei_register, pos.sales_by_terminal, pos.sales_by_hour,
 * inventory.valuation). The pins were reconciled at the manifest source
 * (partners.ar_aging → ar.aging, inventory.stock_valuation →
 * inventory.valuation — the 0025/0027 convention), so resolution is
 * exact-key, never fuzzy.
 *
 * The engine applies pins as-is (no apply-time registry check exists —
 * the PHASE-015 posture), which makes THIS spec the wiring gate: a
 * non-resolving pin in a 030 manifest fails here, loudly.
 *
 * Honest pre-existing note, recorded not hidden: the PHASE-015 retail +
 * grocery manifests pin `inventory.stock_valuation` — a doc spelling the
 * live registry never carried (the live key is inventory.valuation). That
 * pre-030 gap is asserted below as the KNOWN_PRE030_UNRESOLVED_PINS
 * snapshot (it predates this phase; retrofitting those two manifests is a
 * reviewed registry-hygiene change, never a silent 030 edit — INV-022
 * discipline: templates are versioned documents, edited only with their
 * owning phase).
 */

describe("report-pack wiring (industries/reports/README v2.0 mapping; register §J closed)", () => {
  const liveKeys = new Set(REPORT_CONTRACTS.map((contract) => contract.id));

  it("the live registry carries the 81 contracts (no new report keys introduced by PHASE-030)", () => {
    expect(REPORT_CONTRACTS).toHaveLength(81);
  });

  it("every wholesale report pin resolves in the live registry", () => {
    const pins = WHOLESALE_TEMPLATE_MANIFEST.report_defaults;
    expect(pins.map((pin) => pin.report_key)).toEqual([
      "notes.maturity-calendar",
      "notes.aging",
      "ar.aging",
      "inventory.valuation",
    ]);
    const unresolved = pins.filter((pin) => !liveKeys.has(pin.report_key));
    expect(unresolved.map((pin) => pin.report_key).join(", ")).toBe("");
    // The two dashboard pins are the trading day's surfaces.
    expect(pins.find((pin) => pin.report_key === "notes.maturity-calendar")).toMatchObject({
      pinned: true,
      dashboard: true,
    });
    expect(pins.find((pin) => pin.report_key === "ar.aging")).toMatchObject({
      pinned: true,
      dashboard: true,
    });
  });

  it("every electronics report pin resolves in the live registry", () => {
    const pins = ELECTRONICS_TEMPLATE_MANIFEST.report_defaults;
    expect(pins.map((pin) => pin.report_key)).toEqual([
      "retail.imei_register",
      "pos.sales_by_terminal",
      "pos.sales_by_hour",
      "inventory.valuation",
    ]);
    const unresolved = pins.filter((pin) => !liveKeys.has(pin.report_key));
    expect(unresolved.map((pin) => pin.report_key).join(", ")).toBe("");
    // The two dashboard pins are the counter's surfaces.
    expect(pins.find((pin) => pin.report_key === "retail.imei_register")).toMatchObject({
      pinned: true,
      dashboard: true,
    });
    expect(pins.find((pin) => pin.report_key === "pos.sales_by_terminal")).toMatchObject({
      pinned: true,
      dashboard: true,
    });
  });

  it("the pre-030 unresolving pins stay exactly the KNOWN_PRE030_UNRESOLVED_PINS snapshot (retail + grocery doc spellings)", () => {
    const known: readonly { manifest: string; pin: string }[] = Object.freeze([
      { manifest: "industry.retail", pin: "inventory.stock_valuation" },
      { manifest: "industry.grocery", pin: "inventory.stock_valuation" },
    ]);
    const observed: { manifest: string; pin: string }[] = [];
    for (const manifest of [RETAIL_MANIFEST, GROCERY_MANIFEST]) {
      for (const pin of manifest.report_defaults) {
        if (!liveKeys.has(pin.report_key)) {
          observed.push({ manifest: manifest.id, pin: pin.report_key });
        }
      }
    }
    expect(observed.sort((a, b) => a.manifest.localeCompare(b.manifest))).toEqual(
      [...known].sort((a, b) => a.manifest.localeCompare(b.manifest)),
    );
  });
});
