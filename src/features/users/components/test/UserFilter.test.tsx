// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserFilter } from "../UserFilter";

const merchantA = "11111111-1111-4111-8111-111111111111";
const merchantB = "22222222-2222-4222-8222-222222222222";

afterEach(cleanup);

describe("user filter", () => {
  it("offers a merchant choice without exposing ids when the session has several merchants", async () => {
    render(<UserFilter filter={{ page: 1, pageSize: 10 }} merchantIds={[merchantA, merchantB]} onSearch={vi.fn()} />);
    const merchantSelect = screen.getByRole("combobox", { name: /Merchant/ });
    await userEvent.click(merchantSelect);
    expect(await screen.findAllByRole("option")).toHaveLength(3);
    expect(screen.queryByText(new RegExp(`${merchantA}|${merchantB}`))).not.toBeInTheDocument();
  });

  it("shows merchants by code and name when the session carries them", async () => {
    const merchants = [
      { id: merchantA, code: "MC000001", name: "Halo tech" },
      { id: merchantB, code: "MC000002", name: "Green mart" },
    ];
    render(<UserFilter filter={{ page: 1, pageSize: 10 }} merchantIds={[merchantA, merchantB]} merchants={merchants} onSearch={vi.fn()} />);
    const merchantSelect = screen.getByRole("combobox", { name: /Merchant/ });
    await userEvent.click(merchantSelect);
    expect(await screen.findByRole("option", { name: /Green mart/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^Merchant \d/ })).not.toBeInTheDocument();
  });

  it("hides the merchant choice for a single merchant", () => {
    render(<UserFilter filter={{ page: 1, pageSize: 10 }} merchantIds={[merchantA]} onSearch={vi.fn()} />);
    expect(screen.queryByRole("combobox", { name: /Merchant/ })).not.toBeInTheDocument();
  });

  it("searches on Enter", async () => {
    const onSearch = vi.fn();
    render(<UserFilter filter={{ page: 1, pageSize: 10 }} merchantIds={[merchantA]} onSearch={onSearch} />);
    await userEvent.type(screen.getByRole("textbox", { name: /Tên hoặc email/ }), "anh{Enter}");
    expect(onSearch).toHaveBeenCalledWith({ query: "anh" });
  });

  it("sends the chosen permission group and scope together with the text filters", async () => {
    const onSearch = vi.fn();
    const groupId = "33333333-3333-4333-8333-333333333333";
    const subId = "44444444-4444-4444-8444-444444444444";
    render(
      <UserFilter
        filter={{ page: 1, pageSize: 10 }}
        merchantIds={[merchantA]}
        groupOptions={[{ value: groupId, label: "Sale · 4 quyền" }]}
        subMerchantOptions={[{ value: subId, label: "S001 · Halo tech" }]}
        onSearch={onSearch}
      />,
    );
    await userEvent.click(screen.getByRole("combobox", { name: /Nhóm quyền/ }));
    await userEvent.click(await screen.findByRole("option", { name: /Sale/ }));
    await userEvent.click(screen.getByRole("combobox", { name: /Phạm vi/ }));
    await userEvent.click(await screen.findByRole("option", { name: /Halo tech/ }));
    await userEvent.click(screen.getByRole("button", { name: /Tìm kiếm/ }));
    expect(onSearch).toHaveBeenCalledWith({ permissionGroupId: groupId, scope: subId });
  });

  it("offers Master as a scope choice and clears every filter", async () => {
    const onSearch = vi.fn();
    render(<UserFilter filter={{ page: 1, pageSize: 10, scope: "MASTER" }} merchantIds={[merchantA]} onSearch={onSearch} />);
    await userEvent.click(screen.getByRole("button", { name: /Xóa lọc/ }));
    expect(onSearch).toHaveBeenCalledWith({});
  });
});
