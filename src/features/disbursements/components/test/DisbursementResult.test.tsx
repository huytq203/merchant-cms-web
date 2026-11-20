// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { viewFixture } from "../../test/fixtures";
import { DisbursementResult } from "../DisbursementResult";

afterEach(cleanup);
const show = (patch: Partial<typeof viewFixture>) => render(<DisbursementResult view={{ ...viewFixture, ...patch }} onCreateAnother={vi.fn()} />);

describe("DisbursementResult", () => {
  it("announces a created order for an in-flight status", () => {
    show({});
    expect(screen.getByRole("heading", { name: "Đã tạo lệnh chi hộ" })).toBeInTheDocument();
  });

  it("does not show a success headline for a FAILED order found by lookup", () => {
    show({ status: "FAILED", statusLabel: "Thất bại", replayed: true });
    expect(screen.getByRole("heading", { name: "Lệnh chi hộ thất bại" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Đã tạo lệnh chi hộ|đã được tạo trước đó/ })).not.toBeInTheDocument();
  });

  it("does not show a success headline for a CANCELLED order", () => {
    show({ status: "CANCELLED", statusLabel: "Đã hủy" });
    expect(screen.getByRole("heading", { name: "Lệnh chi hộ đã bị hủy" })).toBeInTheDocument();
  });

  it("keeps the replay headline for a non-failed replayed order", () => {
    show({ replayed: true });
    expect(screen.getByRole("heading", { name: "Lệnh này đã được tạo trước đó" })).toBeInTheDocument();
  });
});
