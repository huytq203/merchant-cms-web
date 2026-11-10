import { describe, expect, it } from "vitest";
import { ledgerReconcileStatus } from "../constants/hold-labels";

describe("ledgerReconcileStatus", () => {
  it("never claims a match when the ledger could not be read", () => {
    expect(ledgerReconcileStatus({ reconciles: true, ledgerHeld: null })).toEqual({ label: "Chưa đối soát được sổ cái", tone: "neutral" });
    expect(ledgerReconcileStatus({ reconciles: false, ledgerHeld: null }).label).toBe("Chưa đối soát được sổ cái");
  });

  it("reports a match or a mismatch once the ledger figure is known", () => {
    expect(ledgerReconcileStatus({ reconciles: true, ledgerHeld: 0 })).toEqual({ label: "Khớp sổ cái", tone: "success" });
    expect(ledgerReconcileStatus({ reconciles: false, ledgerHeld: 1000 })).toEqual({ label: "Lệch sổ cái", tone: "warning" });
  });
});
