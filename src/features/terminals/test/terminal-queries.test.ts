import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/http/api-client";
import { parseTerminalSearchParams, terminalQueries } from "../terminal-queries";

describe("terminal list filters", () => {
  it("keeps a known terminal type from the URL and drops an unknown one", () => {
    expect(parseTerminalSearchParams({ terminalType: "QR" })).toEqual({ page: 1, pageSize: 10, terminalType: "QR" });
    expect(parseTerminalSearchParams({ terminalType: "qr" })).toEqual({ page: 1, pageSize: 10 });
    expect(parseTerminalSearchParams({ terminalType: "EDC" })).toEqual({ page: 1, pageSize: 10 });
  });

  it("sends the terminal type to the API and keys the cache by it", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ rows: [], total: 0 });
    const filter = { page: 1, pageSize: 10, terminalType: "POS" as const };
    const query = terminalQueries.list(filter);
    await query.queryFn!({} as never);
    expect(get).toHaveBeenCalledWith("/v1/admin/terminals", expect.objectContaining({
      query: expect.objectContaining({ terminalType: "POS" }),
    }));
    expect(query.queryKey).not.toEqual(terminalQueries.list({ page: 1, pageSize: 10 }).queryKey);
    get.mockRestore();
  });
});
