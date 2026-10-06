// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TerminalRow } from "../types";
import { useTerminalDialogs } from "./use-terminal-dialogs";

const row = { id: "terminal-one", name: "Quầy 1" } as TerminalRow;

describe("terminal dialogs", () => {
  it("opens create without a target and clears state on close", () => {
    const { result } = renderHook(() => useTerminalDialogs());
    act(() => result.current.openFor("edit", row));
    act(() => result.current.openCreate());
    expect(result.current).toMatchObject({ activeDialog: "create", target: null });
    act(() => result.current.close());
    expect(result.current).toMatchObject({ activeDialog: null, target: null });
  });

  it.each(["detail", "edit", "lock", "unlock"] as const)("opens %s for the selected row", (name) => {
    const { result } = renderHook(() => useTerminalDialogs());
    act(() => result.current.openFor(name, row));
    expect(result.current).toMatchObject({ activeDialog: name, target: row });
  });
});
