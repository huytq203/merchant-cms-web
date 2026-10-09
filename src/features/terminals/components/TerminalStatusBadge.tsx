import { StatusBadge } from "@/components/page/StatusBadge";
import type { TerminalRow } from "../types";
import { terminalStatusLabel } from "../utils/terminal-mapper";

export function TerminalStatusBadge({ row }: { row: Pick<TerminalRow, "status" | "lockSource"> }) {
  const label = terminalStatusLabel(row);
  if (row.status === "ACTIVE") return <StatusBadge label={label} tone="success" />;
  if (row.status === "TERMINATED") return <StatusBadge label={label} tone="neutral" />;
  return <StatusBadge label={label} tone={row.lockSource === "CASCADE" ? "warning" : "neutral"} />;
}
