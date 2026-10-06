import { describe, expect, it } from "vitest";
import { REFUND_FIXTURES } from "@/server/modules/refund/refund.fixtures";
import type { Refund } from "../types/type";
import { buildRefundHistory } from "./refund-history";

const base = REFUND_FIXTURES[0]!;
const refund = (patch: Partial<Refund>): Refund => ({ ...base, ...patch });

describe("buildRefundHistory", () => {
  it("has only the creation entry while the request is pending", () => {
    const history = buildRefundHistory(refund({ status: "pending", updatedAt: null }));
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ kind: "created", time: base.createdAt });
  });

  it("adds a status entry only from the stored status and update time", () => {
    const history = buildRefundHistory(refund({ status: "rejected", updatedAt: "2026-09-06T03:00:00.000Z" }));
    expect(history).toHaveLength(2);
    expect(history[1]).toMatchObject({ kind: "rejected", time: "2026-09-06T03:00:00.000Z" });
  });

  it("never invents an actor: only the stored creator is named", () => {
    const history = buildRefundHistory(refund({ status: "approved", createdBy: null, updatedAt: base.createdAt }));
    expect(history.every((entry) => entry.actor === undefined)).toBe(true);
    expect(buildRefundHistory(refund({ createdBy: "Nhân viên mẫu 01" }))[0]?.actor).toBe("Nhân viên mẫu 01");
    expect(JSON.stringify(history)).not.toContain("admin_super");
  });

  it("skips the status entry when the update time is missing", () => {
    expect(buildRefundHistory(refund({ status: "success", updatedAt: null }))).toHaveLength(1);
  });
});
