// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/http/api-client";
import { QueryListState } from "../QueryListState";

type Result = { rows: string[]; total: number };

function Harness({ run }: { run: () => Promise<Result> }) {
  const query = useQuery({ queryKey: ["state"], queryFn: run, retry: false });
  return (
    <QueryListState query={query} emptyText="Không có dữ liệu">
      {(data) => <ul>{data.rows.map((row) => <li key={row}>{row}</li>)}</ul>}
    </QueryListState>
  );
}

function renderHarness(run: () => Promise<Result>) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <Harness run={run} />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("QueryListState", () => {
  it("shows a busy region while loading", () => {
    renderHarness(() => new Promise(() => {}));
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
  });

  it("renders the data", async () => {
    renderHarness(() => Promise.resolve({ rows: ["một", "hai"], total: 2 }));
    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
  });

  it("shows the empty text for an empty page", async () => {
    renderHarness(() => Promise.resolve({ rows: [], total: 0 }));
    expect(await screen.findByText("Không có dữ liệu")).toBeInTheDocument();
  });

  it("shows the error with retry, and the unsupported notice for 501", async () => {
    const failed = renderHarness(() => Promise.reject(new ApiError(502, "Sự cố")));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sự cố");
    failed.unmount();
    renderHarness(() => Promise.reject(new ApiError(501, "Chưa")));
    expect(await screen.findByText("Chưa hỗ trợ")).toBeInTheDocument();
  });
});
