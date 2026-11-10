const TIME_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  hour12: false,
});

/** Zoneless ISO from BE (LocalDateTime, e.g. 2026-11-10T16:13:00[.123]): already Vietnam wall-clock. */
const ZONELESS_ISO = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;
/** Has explicit zone designator (Z or +07:00 / +0700 / +07). */
const HAS_ZONE = /(Z|[+-]\d{2}(:?\d{2})?)$/i;

/**
 * `HH:mm dd/MM` in Vietnam time, independent of the server's own time zone and locale data.
 *
 * Chuỗi KHÔNG có múi giờ là giờ VN sẵn (BE trả LocalDateTime, màn Đơn hàng hiển thị đúng như vậy):
 * lấy thẳng các thành phần. Nếu để `new Date()` parse thì server render (UTC) hiểu nhầm là UTC rồi
 * đổi sang giờ VN, làm lệch +7 tiếng. Chuỗi có Z/offset thì đổi múi giờ như bình thường.
 */
export function formatVnTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const wall = ZONELESS_ISO.exec(iso);
  if (wall && !HAS_ZONE.test(iso)) return `${wall[4]}:${wall[5]} ${wall[3]}/${wall[2]}`;
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
