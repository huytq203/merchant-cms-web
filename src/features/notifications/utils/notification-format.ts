/** Badge text: exact count up to 99, then `99+` so the bell keeps a fixed width. */
export function formatUnreadBadge(count: number): string {
  return count > 99 ? "99+" : String(count);
}

/** Accessible name of the bell; the visual badge is hidden from screen readers, so the count goes here. */
export function bellLabel(count: number): string {
  return count > 0 ? `Thông báo, ${formatUnreadBadge(count)} chưa đọc` : "Thông báo";
}
