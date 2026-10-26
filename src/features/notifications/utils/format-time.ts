import { format } from "date-fns";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Relative for the first week, then the date and time; empty when the BE sent something that is not a date. */
export function formatNotificationTime(iso: string, now: Date = new Date()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  const elapsed = now.getTime() - time;
  if (elapsed < MINUTE) return "Vừa xong";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} phút trước`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} giờ trước`;
  if (elapsed < WEEK) return `${Math.floor(elapsed / DAY)} ngày trước`;
  return format(new Date(time), "dd/MM/yyyy HH:mm");
}
