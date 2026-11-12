"use client";

import { useNow } from "@/features/orders/hooks/use-now";
import type { DisplaySource } from "../customer-display-api";
import { useCustomerDisplay } from "../hooks/use-customer-display";
import { CustomerDisplayView } from "./CustomerDisplayView";

/** Nối hook điều phối với phần trình bày; đồng hồ chỉ chạy khi đang hiện mã có hạn hoặc đang báo thành công. */
export function CustomerDisplayScreen({ source }: { source: DisplaySource }) {
  const { retry, ...state } = useCustomerDisplay(source);
  const now = useNow(state.status === "ready" && state.phase !== "closed");
  return <CustomerDisplayView {...state} now={now} onRetry={retry} seed={source.id} />;
}
