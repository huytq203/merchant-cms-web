const EMPTY = "—";
const PLAIN_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function vnParts(iso: string): Record<string, string> | null {
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return null;
  return Object.fromEntries(PARTS.formatToParts(time).map((part) => [part.type, part.value]));
}

/** `dd/MM/yyyy HH:mm` in Vietnam time, whatever the server's own time zone. */
export function formatVnDateTime(iso: string | null | undefined): string {
  const parts = iso ? vnParts(iso) : null;
  return parts ? `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}` : EMPTY;
}

/** `dd/MM/yyyy`; a BE `yyyy-MM-dd` date is already a Vietnam calendar day and is not shifted. */
export function formatVnDate(value: string | null | undefined): string {
  if (!value) return EMPTY;
  const plain = PLAIN_DATE.exec(value);
  if (plain) return `${plain[3]}/${plain[2]}/${plain[1]}`;
  const parts = vnParts(value);
  return parts ? `${parts.day}/${parts.month}/${parts.year}` : EMPTY;
}

const DAY_PARTS = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });

/** Today's calendar date in Vietnam as `yyyy-MM-dd`, the format BE date filters take. */
export function vnToday(now = new Date()): string {
  return DAY_PARTS.format(now);
}

/** Moves a `yyyy-MM-dd` date by whole days; calendar arithmetic, so no time zone applies. */
export function shiftVnDate(date: string, days: number): string {
  const moved = new Date(`${date}T00:00:00Z`);
  moved.setUTCDate(moved.getUTCDate() + days);
  return moved.toISOString().slice(0, 10);
}
