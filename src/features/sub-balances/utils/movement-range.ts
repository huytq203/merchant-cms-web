import { shiftVnDate } from "@/lib/utils/vn-time";
import type { MovementLink } from "../movement-types";

export type MovementRange = "7d" | "30d" | "90d" | "custom";

/** Days before today each preset reaches back: a preset of N days is today plus the N − 1 days before it. */
const PRESET_OFFSET: Record<Exclude<MovementRange, "custom">, number> = { "7d": -6, "30d": -29, "90d": -89 };

export interface MovementDates {
  fromDate: string | undefined;
  toDate: string | undefined;
}

/**
 * Turns the range select into the `yyyy-MM-dd` Vietnam dates the BE takes (`toDate` is inclusive).
 * "7 ngày" is today plus the 6 days before it, so a preset always spans exactly that many calendar days.
 * A custom range with an empty side leaves that side open.
 */
export function movementRangeToDates(range: MovementRange, today: string, custom: { from: string; to: string } = { from: "", to: "" }): MovementDates {
  if (range === "custom") return { fromDate: custom.from || undefined, toDate: custom.to || undefined };
  return { fromDate: shiftVnDate(today, PRESET_OFFSET[range]), toDate: today };
}

/**
 * The business page that explains a movement, only for pages that exist in the Portal. The order, withdrawal, refund and
 * escrow pages are lists (there is no detail route), so they open the list, narrowed by the order code where the page
 * supports it. Null hides the button.
 */
export function movementBusinessHref(link: Pick<MovementLink, "type" | "code"> | null | undefined, subMerchantId: string): string | null {
  if (!link) return null;
  switch (link.type) {
    case "ORDER":
      return link.code ? `/order?${new URLSearchParams({ orderCode: link.code })}` : "/order";
    case "WITHDRAWAL":
      return "/withdrawal";
    case "REFUND":
      return "/revenue-refunds";
    case "FREEZE":
      return `/revenue-freezes?${new URLSearchParams({ subMerchantId })}`;
    case "ESCROW":
    // Hoàn trả ký quỹ về doanh thu Sub: chưa có trang chi tiết theo mã hoàn trả, mở trang ký quỹ.
    case "ESCROW_RETURN":
      return "/escrow";
    default:
      return null;
  }
}
