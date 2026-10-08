// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import ComplaintLoading from "@/app/(cms)/complaint/loading";
import RefundLoading from "@/app/(cms)/(transaction)/refund/loading";
import TransactionLoading from "@/app/(cms)/(transaction)/transaction/loading";
import DashboardLoading from "@/app/(cms)/dashboard/loading";
import { ListPageSkeleton } from "../ListPageSkeleton";

afterEach(cleanup);

/** Header, filter card and results card: the three blocks of a list page. */
function listBlocks(root: Element) {
  const [header, filterCard, resultsCard] = Array.from(root.children);
  return { count: root.children.length, header, filterCard, resultsCard };
}

describe("ListPageSkeleton structure", () => {
  it("is a busy region with a header, a filter card and a results card", () => {
    const { container } = render(<ListPageSkeleton filterRows={2} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("aria-busy", "true");
    const blocks = listBlocks(root);
    expect(blocks.count).toBe(3);
    expect(blocks.header!.children).toHaveLength(2);
  });

  it("renders one grid row per filter row and drops the header action on request", () => {
    const { container } = render(<ListPageSkeleton filterRows={3} hasAction={false} />);
    const blocks = listBlocks(container.firstElementChild!);
    expect(blocks.filterCard!.firstElementChild!.children).toHaveLength(3);
    expect(blocks.header!.children).toHaveLength(1);
  });
});

describe("route loading skeletons", () => {
  it("match the filter rows of their list page", () => {
    const rows = (element: React.ReactElement) => {
      const { container, unmount } = render(element);
      const count = listBlocks(container.firstElementChild!).filterCard!.firstElementChild!.children.length;
      unmount();
      return count;
    };
    expect(rows(<ComplaintLoading />)).toBe(1);
    expect(rows(<RefundLoading />)).toBe(2);
    expect(rows(<TransactionLoading />)).toBe(2);
  });

  it("dashboard shows a busy title, stat cards, chart and recent list", () => {
    const { container } = render(<DashboardLoading />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("aria-busy", "true");
    const [title, stats, chart, recent] = Array.from(root.children);
    expect(title!.children).toHaveLength(2);
    expect(stats!.children).toHaveLength(4);
    expect(chart!.children).toHaveLength(0);
    expect(recent!.children.length).toBeGreaterThan(1);
  });
});
