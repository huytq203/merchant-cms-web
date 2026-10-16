import { CircleAlert, Inbox } from "lucide-react";
import { RefreshButton } from "./RefreshButton";

interface Props {
  state: "error" | "empty";
  message: string;
  /** Inside a card that already draws the border, so no second frame is drawn. */
  bare?: boolean;
}

/**
 * Error and empty states for a page the server renders from live data. Retrying re-renders the
 * page, so it works without a client query; client lists keep using ResultState.
 */
export function ServerResultState({ state, message, bare = false }: Props) {
  const isError = state === "error";
  const Icon = isError ? CircleAlert : Inbox;
  return (
    <div
      role={isError ? "alert" : undefined}
      className={`flex min-h-56 flex-col items-center justify-center gap-3 px-4 py-10 text-center ${bare ? "" : "rounded-xl border border-border bg-background"}`}
    >
      <Icon className={isError ? "size-8 text-danger" : "size-8 text-primary"} aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {isError ? <RefreshButton label="Thử lại" /> : null}
    </div>
  );
}
