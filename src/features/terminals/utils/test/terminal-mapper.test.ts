import { describe, expect, it } from "vitest";
import { terminalStatusLabel, terminalTypeLabel } from "../terminal-mapper";

describe("terminal labels", () => {
  it("distinguishes a direct lock from a cascade lock and never returns the raw code", () => {
    const direct = terminalStatusLabel({ status: "INACTIVE", lockSource: "DIRECT" });
    const cascade = terminalStatusLabel({ status: "INACTIVE", lockSource: "CASCADE" });
    expect(direct).not.toBe(cascade);
    for (const label of [direct, cascade, terminalStatusLabel({ status: "ACTIVE" }), terminalStatusLabel({ status: "TERMINATED" })]) {
      expect(label).not.toMatch(/^[A-Z_]+$/);
    }
  });

  it("keeps a lock-source-less INACTIVE terminal as a direct lock", () => {
    expect(terminalStatusLabel({ status: "INACTIVE", lockSource: null })).toBe(terminalStatusLabel({ status: "INACTIVE", lockSource: "DIRECT" }));
  });

  it("labels every terminal type", () => {
    expect(terminalTypeLabel("ONLINE")).not.toBe("ONLINE");
    expect(terminalTypeLabel("POS")).toBeTruthy();
    expect(terminalTypeLabel("QR")).toBeTruthy();
  });
});
