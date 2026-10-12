const TIME_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  hour12: false,
});

/** `HH:mm dd/MM` in Vietnam time, independent of the server's own time zone and locale data. */
export function formatVnTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return "—";
  const part = (type: Intl.DateTimeFormatPartTypes) => TIME_PARTS.formatToParts(time).find((item) => item.type === type)?.value ?? "";
  return `${part("hour")}:${part("minute")} ${part("day")}/${part("month")}`;
}

/** `+3 đơn so với hôm qua`, `-2 …`, or `bằng hôm qua`. */
export function describeChange(today: number, yesterday: number): { text: string; direction: "up" | "down" | "flat" } {
  const delta = today - yesterday;
  if (delta === 0) return { text: "bằng hôm qua", direction: "flat" };
  return { text: `${delta > 0 ? "+" : "−"}${Math.abs(delta)} đơn so với hôm qua`, direction: delta > 0 ? "up" : "down" };
}
