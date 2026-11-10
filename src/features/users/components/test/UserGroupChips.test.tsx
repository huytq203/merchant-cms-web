// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { UserGroupChips } from "../UserGroupChips";

afterEach(cleanup);

describe("user group chips", () => {
  it("keeps two groups with the same name as two chips, each with its own permission count", () => {
    render(<UserGroupChips items={[
      { id: "11111111-1111-4111-8111-111111111111", name: "Sale", permissionCount: 4 },
      { id: "22222222-2222-4222-8222-222222222222", name: "Sale", permissionCount: 7 },
    ]} />);
    expect(screen.getByText("Sale · 4 quyền")).toBeInTheDocument();
    expect(screen.getByText("Sale · 7 quyền")).toBeInTheDocument();
  });

  it("shows +n for the groups beyond the limit", () => {
    render(<UserGroupChips items={[
      { id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" },
    ]} limit={2} />);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });
});
