import { describe, expect, it } from "vitest";

import {
  AUTOMOTIVE_TEMPLATE_MANIFEST,
  DISTRIBUTION_TEMPLATE_MANIFEST,
  ELECTRONICS_TEMPLATE_MANIFEST,
  FOOD_MANUFACTURING_TEMPLATE_MANIFEST,
  GROCERY_MANIFEST,
  PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST,
  RESTAURANT_MANIFEST,
  RETAIL_MANIFEST,
  WHOLESALE_TEMPLATE_MANIFEST,
  hashManifestJson,
  type IndustryTemplateManifest,
} from "@erp/contracts";

import { composeTenantStaticConfig } from "../application/resolve/compose";
import { PLAN_KEYS, layerInputsFixture, l1Of, type PlanKey } from "./layer-fixtures";

/**
 * PHASE-015 §6 golden effective-configs (CONFIGURATION_ENGINE §10 #2):
 * one pinned, hashed effective config per shipped template × plan ×
 * jurisdiction example — the nine v1.0.0 manifests (retail / grocery /
 * restaurant + the PHASE-017 automotive / distribution pair + the
 * PHASE-018 food manufacturing template + the PHASE-019 professional
 * services template + the PHASE-030 wholesale / electronics pair) × the
 * plan seeds
 * (migration 0008/0021/0024/0025/0026/0027) × the SA jurisdiction seed
 * (migration 0013, pack 1.0.0-baseline, VAT in force, registered tenant).
 *
 * A resolution change that alters any golden hash fails CI unless the
 * change is a reviewed decision — that is this spec's entire job. The
 * structural assertions beside each pin exist so a mismatch is debuggable,
 * not so they can substitute for the pin.
 *
 * PHASE-017 review note: the business/enterprise pins were re-pinned with
 * the 0025 plan grants (sales.job_cards + the distribution/commission set
 * + inventory.reservations on business) — the L4 layer is part of the
 * hashed content, so the reviewed seed change moves exactly those pins.
 *
 * PHASE-018 review note: every pin moved — the 0026 plan grants added the
 * seven manufacturing keys to business (enterprise already had them;
 * starter untouched), and the four manufacturing SETTINGS_REGISTRY keys
 * (qc_gate/scrap_reason_required/fg_batch_expiry_from_shelf_life/
 * consumption_variance_threshold_pct) land in every tenant's policy map
 * as platform defaults (SETTINGS_REGISTRY defaults are the lowest rung of
 * the hashed §5 policies). The three new food_manufacturing rows pin with
 * the rest.
 *
 * PHASE-019 review note: every pin moved again — the 0027 plan grants
 * added the six CRM+projects keys to business (enterprise already had
 * them; starter untouched), and the SEVEN new SETTINGS_REGISTRY keys (the
 * six crm.* policy keys + the platform-only crm.defer_advance_recognition)
 * land in every tenant's policy map as platform defaults (the §5 policies
 * map is part of the hashed content). The old→new table is recorded in
 * agent-ctx/T43-2-template.md; the three new professional_services rows
 * pin with the rest.
 *
 * PHASE-028 review note: every pin moved again — the two SETTINGS_REGISTRY
 * budgeting control keys (budgeting.controls.mode +
 * budgeting.controls.warn_threshold_percent, BR-051 — advisory-by-default
 * policy) land in every tenant's policy map as platform defaults, so all
 * 22 pins re-pinned in-phase (the P28-A settings-key wave; the migration
 * 0039 plan grants add the six budgeting feature keys to business+
 * enterprise, moving those pins a second notch). Starter carries only the
 * policy-default shift (no new grants). Recorded in
 * agent-ctx/P28-B-budgeting-core.md.
 *
 * PHASE-029 review note: every pin moved again — the four SETTINGS_REGISTRY
 * payroll policy keys (payroll.loans.max_deduction_percent /
 * payroll.loans.control_account_id / payroll.eos.enabled /
 * payroll.eos.accrual_days_per_service_year, BR-054/BR-055) land in every
 * tenant's policy map as platform defaults, so all 22 pins re-pinned
 * in-phase (the P29-A settings-key wave; the migration 0040 plan grants
 * add the eight payroll feature keys to business+enterprise, moving those
 * pins a second notch — the same two-notch pattern as 028). Starter
 * carries only the policy-default shift (no new grants). Recorded in
 * agent-ctx/P29-B-payroll-core.md.
 *
 * PHASE-030 review note: the fifteen business/enterprise pins (7 templates
 * × business + 7 × enterprise + the no-template business row) moved — the
 * layer fixtures now mirror the 0038 notes + installments grant wave
 * (twelve keys → business + enterprise, transcribed because the wholesale
 * template's REQUIRED pdc_notes chain consumes it; the P28/P29 grant waves
 * stay un-mirrored per the recorded posture). Starter rows unchanged. The
 * six new wholesale/electronics rows pin with the 0041 seeds. The old→new
 * table is recorded in agent-ctx/P30-A-contracts-migration.md.
 */

const GOLDEN: Readonly<
  Record<string, { readonly template: IndustryTemplateManifest | null; readonly hash: string }>
> = Object.freeze({
  "industry.retail × starter": {
    template: RETAIL_MANIFEST,
    hash: "sha256:eb9628332b3a583f7f2d5afb431b00523e6740774f6ca54013db3db00109249f",
  },
  "industry.retail × business": {
    template: RETAIL_MANIFEST,
    hash: "sha256:211598c8c1728a9b32026ec6d7d36056c266666a71c79b9ca37aeac51ffb4acf",
  },
  "industry.retail × enterprise": {
    template: RETAIL_MANIFEST,
    hash: "sha256:8b1530d732c939cf851c5922b4d2733d283bb3e834aa18178ca6a73e746def92",
  },
  "industry.grocery × starter": {
    template: GROCERY_MANIFEST,
    hash: "sha256:149fc20d61fe55014c49cb5496551f324f76f31e3198c3e96b7ee7f2d3ccde40",
  },
  "industry.grocery × business": {
    template: GROCERY_MANIFEST,
    hash: "sha256:e80f9c37197c066b315385a2e1715825571f148917d5d5d75af148ea3de862e1",
  },
  "industry.grocery × enterprise": {
    template: GROCERY_MANIFEST,
    hash: "sha256:9f5f602fa07c59f3545b79788c11509e0b492905a9fa637bd77ca432634b754b",
  },
  "industry.restaurant × starter": {
    template: RESTAURANT_MANIFEST,
    hash: "sha256:45a3dff7b9998a237e7a60cc0d5b27d5e59445cb1b2e9c73d1266a579eac3515",
  },
  "industry.restaurant × business": {
    template: RESTAURANT_MANIFEST,
    hash: "sha256:2730405c744e919b8e0daf8f39e6dc39caec3600d9e1d575d732b132bb04308d",
  },
  "industry.restaurant × enterprise": {
    template: RESTAURANT_MANIFEST,
    hash: "sha256:db34e45ef98f7d5cf8f862d10e293a50b090ba7f0336c8d70817d21b757bd98e",
  },
  // -- PHASE-017 pair (migration 0025 seeds; starter = degraded back-office)
  "industry.automotive × starter": {
    template: AUTOMOTIVE_TEMPLATE_MANIFEST,
    hash: "sha256:f235e31eb262fc20bc6e5b971f6a610dde7aa3d9b323ddaf63c261333bd8c155",
  },
  "industry.automotive × business": {
    template: AUTOMOTIVE_TEMPLATE_MANIFEST,
    hash: "sha256:3c9302b0b57718fb87e9e07a276254a8bc63c211850f795467609512837188d4",
  },
  "industry.automotive × enterprise": {
    template: AUTOMOTIVE_TEMPLATE_MANIFEST,
    hash: "sha256:78fc2144e3ae0e0dd70ad8fef3051622febcb1f53adf687d1ab5f491710a8a28",
  },
  "industry.distribution × starter": {
    template: DISTRIBUTION_TEMPLATE_MANIFEST,
    hash: "sha256:d1fbcde5d7194c1fcca7007e614e56051f04bffeb224852972ad854ebff5a006",
  },
  "industry.distribution × business": {
    template: DISTRIBUTION_TEMPLATE_MANIFEST,
    hash: "sha256:77f2893fd6f962921e6ed33de9efe27f042384a13600c64f2bba51f8c2a11373",
  },
  "industry.distribution × enterprise": {
    template: DISTRIBUTION_TEMPLATE_MANIFEST,
    hash: "sha256:2100745a5ceed55442866505e58735f0471012114c92e4e8d9e085c56cf1a348",
  },
  // -- PHASE-018 (migration 0026 seed; starter = degraded back-office)
  "industry.food_manufacturing × starter": {
    template: FOOD_MANUFACTURING_TEMPLATE_MANIFEST,
    hash: "sha256:4daf9772dae8e26d51ad2fa27795aab5d0b1e0309a99d4dff21c9f0cb44b8de4",
  },
  "industry.food_manufacturing × business": {
    template: FOOD_MANUFACTURING_TEMPLATE_MANIFEST,
    hash: "sha256:80964a32bbdbf971bab1af6d14a4442d9976e074c8e1351c3864bfef6ca01af0",
  },
  "industry.food_manufacturing × enterprise": {
    template: FOOD_MANUFACTURING_TEMPLATE_MANIFEST,
    hash: "sha256:34cdbf0f93124b1e68b268821c2ba8d40b7528cb642653ae9ab200d807d65433",
  },
  // -- PHASE-019 (migration 0027 seed; starter = degraded back-office)
  "industry.professional_services × starter": {
    template: PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST,
    hash: "sha256:61f6f7755b1e2f84458bee50544eafee8439e577824607df08cc96922cb44912",
  },
  "industry.professional_services × business": {
    template: PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST,
    hash: "sha256:f2210855a976c6adbc8670d18577764133c9fac28f068d38c1d117e8eb0c6063",
  },
  "industry.professional_services × enterprise": {
    template: PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST,
    hash: "sha256:7531130f64c8eccc3b81c0cc4422168b00d398bb7d28a20038b175b7d404a5d5",
  },
  // -- PHASE-030 (migration 0041 seeds; starter = degraded back-office —
  // the notes chain + POS/service-order sets are business+enterprise)
  "industry.wholesale × starter": {
    template: WHOLESALE_TEMPLATE_MANIFEST,
    hash: "sha256:0a8dc4b683049cfdc2a2cb28f7d8712061442b78f0bce0f337aa633d4a4f802c",
  },
  "industry.wholesale × business": {
    template: WHOLESALE_TEMPLATE_MANIFEST,
    hash: "sha256:5f113ee0ffbd16085924066461698a2f9120c7b91b836d3e80b99b3c6b1f1028",
  },
  "industry.wholesale × enterprise": {
    template: WHOLESALE_TEMPLATE_MANIFEST,
    hash: "sha256:35aab1413ccea9da60d44b8e6c4d00173114346e7249e969704ad920feff395a",
  },
  "industry.electronics × starter": {
    template: ELECTRONICS_TEMPLATE_MANIFEST,
    hash: "sha256:c5ec279713ce522dcde582822c006e93549efdd25ceacd6f21aa21b130df44a9",
  },
  "industry.electronics × business": {
    template: ELECTRONICS_TEMPLATE_MANIFEST,
    hash: "sha256:699731c811096d401c43ce8963a95f9cd6db8517ab1ed0f2c764234dae9ed683",
  },
  "industry.electronics × enterprise": {
    template: ELECTRONICS_TEMPLATE_MANIFEST,
    hash: "sha256:eee6dc38af26b4a3f5ee8a8abc24956e471dd51d63181d707ca78f12555cb9d9",
  },
  // The platform-default tenant (no template applied — L1 neutral).
  "(no template) × business": {
    template: null,
    hash: "sha256:393178c237ab9bad52fe62fb81e18c44a5b281202851e33fe0ccc1890d6f8435",
  },
});

const PLANS: Readonly<Record<string, PlanKey>> = Object.freeze({
  starter: "starter",
  business: "business",
  enterprise: "enterprise",
});

function planOf(caseName: string): PlanKey {
  const plan = caseName.split("×")[1]?.trim() as PlanKey | undefined;
  return PLANS[plan ?? ""] ?? "business";
}

describe("golden effective-configs: template × plan × jurisdiction SA (pinned hashes)", () => {
  for (const [caseName, golden] of Object.entries(GOLDEN)) {
    it(`${caseName} resolves to the pinned resolved_hash`, () => {
      const config = composeTenantStaticConfig(
        layerInputsFixture({ template: golden.template, plan: planOf(caseName) }),
      );
      // The pin: any resolution change that alters this hash fails CI
      // unless reviewed (§10 #2).
      expect(config.resolved_hash).toBe(golden.hash);
      // Re-composing is byte-stable.
      const again = composeTenantStaticConfig(
        layerInputsFixture({ template: golden.template, plan: planOf(caseName) }),
      );
      expect(again.resolved_hash).toBe(golden.hash);
      expect(again).toEqual(config);
    });
  }

  it("every golden fixture carries the §5 shape", () => {
    for (const [caseName, golden] of Object.entries(GOLDEN)) {
      const config = composeTenantStaticConfig(
        layerInputsFixture({ template: golden.template, plan: planOf(caseName) }),
      );
      expect(config.config_version).toBe(3);
      expect(config.tenant).toMatchObject({
        id: "01920000-0000-7000-8000-000000000001",
        jurisdiction: "SA",
        base_currency: "SAR",
      });
      expect(config.layers.l2_jurisdiction_pack).toMatchObject({
        country_code: "SA",
        pack_version: "1.0.0-baseline",
        vat_status: "VAT_IN_FORCE",
        tenant_registration: "REGISTERED",
      });
      expect(config.layers.l3_plan?.key).toBe(planOf(caseName));
      expect(config.layers.l3_plan?.limits).toMatchObject({
        users: { starter: 3, business: 10, enterprise: 50 }[planOf(caseName)],
      });
      expect(config.layers.l4_entitlements.active).toEqual([...PLAN_KEYS[planOf(caseName)]].sort());
      expect(config.invariants_note).toContain("INV-022");
      // L1 block shape + manifest-hash provenance.
      if (golden.template === null) {
        expect(config.layers.l1_template).toBeNull();
        expect(config.tenant.industry_template).toBeNull();
      } else {
        expect(config.layers.l1_template).toEqual({
          key: golden.template.id,
          version: "1.0.0",
          terminology_overrides: Object.keys(golden.template.terminology_overrides).length,
        });
        expect(l1Of(golden.template).manifestHash).toBe(hashManifestJson(golden.template));
        // The retail/grocery/restaurant L1 defaults all auto-post cash
        // sales; the PHASE-017 pair (back-office workshop / van sales, not
        // POS-first) deliberately leaves the platform default in place.
        // PHASE-030: electronics auto-posts its counter cash sales (POS-first
        // like retail); wholesale is credit-first trading and leaves the
        // platform default in place.
        if (
          golden.template.id === "industry.retail" ||
          golden.template.id === "industry.grocery" ||
          golden.template.id === "industry.restaurant" ||
          golden.template.id === "industry.electronics"
        ) {
          expect(config.policies["sales.cash_autopost"]).toBe(true);
        } else {
          expect(config.policies["sales.cash_autopost"]).toBe(false);
        }
      }
    }
  });

  it("per-template golden structure (debuggability anchors beside the pins)", () => {
    // The platform-default tenant (no template) — computed once; the
    // manufacturing platform defaults anchor sits at the end of this test.
    const noTemplate = composeTenantStaticConfig(layerInputsFixture({ template: null }));
    expect(noTemplate.tenant.industry_template).toBeNull();

    // Retail on business: full closure, POS visible, no phase gates.
    const retail = composeTenantStaticConfig(
      layerInputsFixture({ template: RETAIL_MANIFEST, plan: "business" }),
    );
    expect(retail.layers.l4_entitlements.missing).toEqual([]);
    expect(retail.ui.navigation).toEqual(["selling", "stock"]);
    expect(retail.ui.emphasis).toEqual(["selling", "stock"]);
    expect(retail.ui.terminology["pos.terminal"]).toEqual({ en: "Terminal", ar: "الطرفية" });
    expect(retail.policies["inventory.fefo_for_expiry_items"]).toBe(false);

    // Grocery on starter: degraded (no POS, no batch tracking, no tiers).
    const grocery = composeTenantStaticConfig(
      layerInputsFixture({ template: GROCERY_MANIFEST, plan: "starter" }),
    );
    expect(grocery.layers.l4_entitlements.missing).toEqual([
      "distribution.customer_tiers",
      "industry.template_engine",
      "inventory.batch_tracking",
      "inventory.stock_counts",
      "pos.barcode_scanning",
      "pos.offline_queue",
      "pos.receipts",
      "pos.sales",
      "pos.terminals",
      "treasury.cashier_shifts",
    ]);
    // "selling" survives on the ungated tiers item (POS hides); "expiry"
    // items are all ungated core screens.
    expect(grocery.ui.navigation).toEqual(["selling", "expiry"]);
    expect(grocery.policies["inventory.fefo_for_expiry_items"]).toBe(true);
    expect(grocery.policies["expiry_writeoff_requires_approval"]).toBe(true);

    // Restaurant on business (PHASE-016 flipped): the floor entries are
    // LIVE (intake keys granted by the plan), nothing missing, RC combos on.
    const restaurant = composeTenantStaticConfig(
      layerInputsFixture({ template: RESTAURANT_MANIFEST, plan: "business" }),
    );
    expect(restaurant.layers.l4_entitlements.missing).toEqual([]);
    expect(restaurant.ui.navigation).toEqual(["floor", "day"]);
    expect(
      restaurant.ui.navigation_tree[0]?.items.filter((item) => item.phase_gated === "PHASE-016")
        .length,
    ).toBe(0);
    expect(restaurant.policies["numbering.purchase_order.assign_at"]).toBe("approval");
    expect(restaurant.policies["combo_explosion_at_posting"]).toBe(true);
    expect(restaurant.policies["service_charge_default_rate"]).toBe(0);

    // Automotive on business (PHASE-017): full closure on the 0025 plan
    // grants — the workshop set resolves LIVE (job cards included), the
    // workshop/parts navigation derives, and the job-card policies land.
    const automotive = composeTenantStaticConfig(
      layerInputsFixture({ template: AUTOMOTIVE_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(automotive.layers.l4_entitlements.missing).toEqual([]);
    expect(automotive.ui.navigation).toEqual(["workshop", "parts"]);
    const workshop = automotive.ui.navigation_tree.find((group) => group.id === "workshop")!;
    expect(workshop.items.map((item) => item.id)).toEqual(["job_cards", "vehicles", "quotes"]);
    expect(workshop.items.every((item) => item.phase_gated === undefined)).toBe(true);
    const parts = automotive.ui.navigation_tree.find((group) => group.id === "parts")!;
    expect(parts.items.map((item) => item.id)).toEqual(["parts_stock", "purchasing", "counter"]);
    // Terminology: AR + EN workshop labels (template > glossary).
    expect(automotive.ui.terminology["svc.job_card"]).toEqual({
      en: "Job card",
      ar: "بطاقة عمل",
    });
    expect(automotive.ui.terminology["svc.labor"]).toEqual({ en: "Labor", ar: "أجور العمل" });
    expect(automotive.ui.terminology["vehicle.chassis_no"]).toEqual({
      en: "Chassis number (VIN)",
      ar: "رقم الهيكل",
    });
    // Workflow policies + numbering (PO reserved at approval).
    expect(automotive.policies["job_card_parts_issue_mode"]).toBe("reserve");
    expect(automotive.policies["job_card_labor_rate_source"]).toBe("price_list");
    expect(automotive.policies["quotation_validity_days"]).toBe(7);
    expect(automotive.policies["warranty_credit_note_requires_original_invoice"]).toBe(true);
    expect(automotive.policies["numbering.job_card.assign_at"]).toBe("posting");
    expect(automotive.policies["numbering.purchase_order.assign_at"]).toBe("approval");
    expect(automotive.policies["inventory.fefo_for_expiry_items"]).toBe(false);

    // Distribution on business (PHASE-017): the field/settle groups resolve
    // with the full distribution module enabled, tier + settlement policies
    // land, and the van-sales terminology carries the Arabic field labels.
    const distribution = composeTenantStaticConfig(
      layerInputsFixture({ template: DISTRIBUTION_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(distribution.layers.l4_entitlements.missing).toEqual([]);
    expect(distribution.ui.navigation).toEqual(["field", "settle"]);
    expect(
      distribution.ui.navigation_tree
        .find((group) => group.id === "field")!
        .items.map((item) => item.id),
    ).toEqual(["routes", "van_stock", "collections"]);
    expect(
      distribution.ui.navigation_tree
        .find((group) => group.id === "settle")!
        .items.map((item) => item.id),
    ).toEqual(["rep_settlements", "commissions"]);
    expect(distribution.ui.terminology["route.route"]).toEqual({ en: "Route", ar: "خط السير" });
    expect(distribution.ui.terminology["van.load_out"]).toEqual({
      en: "Load-out",
      ar: "التحميل الصباحي",
    });
    expect(distribution.ui.terminology["settlement.rep_settlement"]).toEqual({
      en: "Rep settlement",
      ar: "تسوية المندوب",
    });
    expect(distribution.ui.terminology["hr.field_rep"]).toEqual({
      en: "Sales rep (van)",
      ar: "مندوب التوزيع",
    });
    expect(distribution.policies["van_loadout_requires_transfer"]).toBe(true);
    expect(distribution.policies["settlement_required_daily"]).toBe(true);
    expect(distribution.policies["tier_price_automatic_by_partner"]).toBe(true);
    expect(distribution.policies["free_goods_require_reason_code"]).toBe(true);
    expect(distribution.policies["inventory.fefo_for_expiry_items"]).toBe(true);
    expect(distribution.layers.l8_installed.distribution).toBe(true);

    // Food manufacturing on business (PHASE-018): the full manufacturing
    // set resolves LIVE on the 0026 grants — the production/trace groups
    // derive with the manufacturing module enabled, and the four §6
    // workflow policies land as L1 defaults (qc_gate required).
    const food = composeTenantStaticConfig(
      layerInputsFixture({ template: FOOD_MANUFACTURING_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(food.layers.l4_entitlements.missing).toEqual([]);
    expect(food.ui.navigation).toEqual(["production", "trace"]);
    const production = food.ui.navigation_tree.find((group) => group.id === "production")!;
    expect(production.items.map((item) => item.id)).toEqual(["recipes", "orders", "qc"]);
    expect(
      food.ui.navigation_tree.find((group) => group.id === "trace")!.items.map((item) => item.id),
    ).toEqual(["genealogy", "expiry"]);
    expect(food.ui.terminology["mfg.recipe"]).toEqual({
      en: "Recipe (BOM)",
      ar: "الوصفة (قائمة المواد)",
    });
    expect(food.ui.terminology["mfg.qc_gate"]).toEqual({
      en: "QC gate",
      ar: "بوابة فحص الجودة",
    });
    expect(food.policies["manufacturing.qc_gate"]).toBe("required"); // L1 manifest default
    expect(food.policies["manufacturing.scrap_reason_required"]).toBe(true);
    expect(food.policies["manufacturing.fg_batch_expiry_from_shelf_life"]).toBe(true);
    expect(food.policies["manufacturing.consumption_variance_threshold_pct"]).toBe(5);
    expect(food.policies["inventory.fefo_for_expiry_items"]).toBe(true);
    expect(food.layers.l8_installed.manufacturing).toBe(true);

    // Professional services on business (PHASE-019): the full CRM+projects
    // set resolves LIVE on the 0027 grants — the practice/billing groups
    // derive with the crm module enabled, the §9 workflow policies land as
    // L1 defaults (contract_billing_mode retainer_or_milestones), and the
    // crm module installs (L8 from default_modules_enabled).
    const services = composeTenantStaticConfig(
      layerInputsFixture({ template: PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(services.layers.l4_entitlements.missing).toEqual([]);
    expect(services.ui.navigation).toEqual(["practice", "billing"]);
    const practiceGroup = services.ui.navigation_tree.find((group) => group.id === "practice")!;
    expect(practiceGroup.items.map((item) => item.id)).toEqual([
      "cases",
      "timesheets",
      "contracts",
    ]);
    expect(
      services.ui.navigation_tree
        .find((group) => group.id === "billing")!
        .items.map((item) => item.id),
    ).toEqual(["recurring", "invoices", "statements"]);
    expect(services.ui.terminology["svc.case"]).toEqual({
      en: "Case / Matter",
      ar: "القضية / الملف",
    });
    expect(services.ui.terminology["doc.contract"]).toEqual({
      en: "Service contract",
      ar: "عقد الخدمات",
    });
    expect(services.policies["crm.contract_billing_mode"]).toBe("retainer_or_milestones"); // L1 manifest default
    expect(services.policies["crm.time_entries_require_case"]).toBe(true);
    expect(services.policies["crm.unbilled_time_review_before_invoice"]).toBe(true);
    expect(services.policies["crm.invoice_approval_required"]).toBe(true);
    expect(services.policies["crm.invoice_numbering_per_series"]).toBe(false);
    expect(services.policies["crm.narrative_required_on_time_billing"]).toBe(true);
    expect(services.policies["inventory.fefo_for_expiry_items"]).toBe(false);
    expect(services.layers.l8_installed.crm).toBe(true);

    // The platform defaults (no template): the four manufacturing keys ride
    // the SETTINGS_REGISTRY defaults into every tenant's policy map — the
    // manufacturing services read them via resolved config (PHASE-018 §6);
    // likewise the SEVEN PHASE-019 keys (§18 lesson 5: ALL golden rows move
    // because these land in every tenant's policies map).
    expect(noTemplate.policies["manufacturing.qc_gate"]).toBe("off");
    expect(noTemplate.policies["manufacturing.scrap_reason_required"]).toBe(true);
    expect(noTemplate.policies["manufacturing.fg_batch_expiry_from_shelf_life"]).toBe(true);
    expect(noTemplate.policies["manufacturing.consumption_variance_threshold_pct"]).toBe(5);
    expect(noTemplate.policies["crm.contract_billing_mode"]).toBe("retainer_or_milestones");
    expect(noTemplate.policies["crm.time_entries_require_case"]).toBe(true);
    expect(noTemplate.policies["crm.unbilled_time_review_before_invoice"]).toBe(true);
    expect(noTemplate.policies["crm.invoice_approval_required"]).toBe(true);
    expect(noTemplate.policies["crm.invoice_numbering_per_series"]).toBe(false);
    expect(noTemplate.policies["crm.narrative_required_on_time_billing"]).toBe(true);
    expect(noTemplate.policies["crm.defer_advance_recognition"]).toBe(false); // platform-only key
  });

  it("distinct inputs produce distinct pins (the pins are content, not form)", () => {
    const hashes = new Set(Object.values(GOLDEN).map((golden) => golden.hash));
    expect(hashes.size).toBe(Object.keys(GOLDEN).length);
  });

  it("a reviewed change updates exactly its pin (retail × business differs from starter)", () => {
    const starter = composeTenantStaticConfig(
      layerInputsFixture({ template: RETAIL_MANIFEST, plan: "starter" }),
    );
    expect(starter.resolved_hash).not.toBe(GOLDEN["industry.retail × business"]?.hash);
    expect(starter.resolved_hash).toBe(GOLDEN["industry.retail × starter"]?.hash);
  });
});
