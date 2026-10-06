type Props = { label: string; value: string };

export function DetailRow({ label, value }: Props) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
