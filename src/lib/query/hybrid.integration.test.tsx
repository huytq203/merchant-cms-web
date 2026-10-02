// @vitest-environment jsdom
import { HydrationBoundary, QueryClientProvider, queryOptions, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeQueryClient } from "@/lib/query/query-client";

const clientFetch = vi.fn(async () => ({ items: ["from-client"] }));

const listQueries = {
  list: (filters: { page: number }) =>
    queryOptions({
      queryKey: ["things", filters] as const,
      queryFn: clientFetch,
      staleTime: 30_000,
    }),
};

function ThingList({ filters }: { filters: { page: number } }) {
  const query = useQuery(listQueries.list(filters));
  if (query.isPending) return <p>loading</p>;
  if (query.isError) return <p role="alert">error</p>;
  return <ul>{query.data.items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

describe("Hybrid: server prefetch → HydrationBoundary → useQuery", () => {
  it("renders prefetched data without an immediate client refetch", async () => {
    const { dehydrate } = await import("@tanstack/react-query");
    const serverClient = makeQueryClient();
    await serverClient.prefetchQuery({
      ...listQueries.list({ page: 1 }),
      queryFn: async () => ({ items: ["from-server"] }),
    });
    const state = dehydrate(serverClient);

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <HydrationBoundary state={state}>
          <ThingList filters={{ page: 1 }} />
        </HydrationBoundary>
      </QueryClientProvider>,
    );

    expect(screen.getByText("from-server")).toBeInTheDocument();
    expect(clientFetch).not.toHaveBeenCalled();
  });

  it("falls back to the client fetch when the server prefetch failed", async () => {
    const { dehydrate } = await import("@tanstack/react-query");
    const serverClient = makeQueryClient();
    await serverClient.prefetchQuery({
      ...listQueries.list({ page: 2 }),
      queryFn: async () => {
        throw new Error("HTTP_500");
      },
    });

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <HydrationBoundary state={dehydrate(serverClient)}>
          <ThingList filters={{ page: 2 }} />
        </HydrationBoundary>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("from-client")).toBeInTheDocument();
    expect(clientFetch).toHaveBeenCalledTimes(1);
  });
});
