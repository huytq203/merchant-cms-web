// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { freezeSchema } from "../../schemas";
import { activeFreeze, releasedFreeze } from "../../test/fixtures";
import { FreezeReleaseList } from "../FreezeReleaseList";

afterEach(cleanup);

describe("FreezeReleaseList", () => {
  it("lists each release newest first with amount, state and when the ledger finished", () => {
    render(<FreezeReleaseList freeze={freezeSchema.parse(activeFreeze)} />);
    const rows = within(screen.getByRole("table", { name: "Các lần gỡ băng FZ2611030001" })).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("100.000");
    expect(within(rows[0] as HTMLElement).getByText("Đang xử lý")).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent("Chờ sổ cái xử lý");
    expect(rows[1]).toHaveTextContent("300.000");
    expect(within(rows[1] as HTMLElement).getByText("Thành công")).toBeInTheDocument();
  });

  it("says there is no release yet", () => {
    render(<FreezeReleaseList freeze={freezeSchema.parse(releasedFreeze)} />);
    expect(screen.getByText("Chưa có lần gỡ băng nào.")).toBeInTheDocument();
  });
});
