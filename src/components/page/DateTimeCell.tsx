import { format } from "date-fns";

interface DateTimeCellProps {
  value?: Date | string | number | null;
}

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

export function DateTimeCell({ value }: DateTimeCellProps) {
  if (value === null || value === undefined || value === "") return <span>Chưa có</span>;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return <span>Chưa có</span>;

  return <time className="tabular-nums" dateTime={date.toISOString()}>{format(date, "dd/MM/yyyy HH:mm")}</time>;
}
