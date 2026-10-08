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
    const [, merchantSelect] = screen.getAllByRole("combobox");
    await userEvent.click(merchantSelect!);
    expect(await screen.findAllByRole("option")).toHaveLength(3);
    expect(screen.queryByText(new RegExp(`${merchantA}|${merchantB}`))).not.toBeInTheDocument();
  });

  it("hides the merchant choice for a single merchant", () => {
    render(<UserFilter filter={{ page: 1, pageSize: 10 }} merchantIds={[merchantA]} onSearch={vi.fn()} />);
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("searches on Enter", async () => {
    const onSearch = vi.fn();
    render(<UserFilter filter={{ page: 1, pageSize: 10 }} merchantIds={[merchantA]} onSearch={onSearch} />);
    await userEvent.type(screen.getByRole("textbox", { name: /Tên hoặc email/ }), "anh{Enter}");
    expect(onSearch).toHaveBeenCalledWith({ query: "anh" });
  });
});
