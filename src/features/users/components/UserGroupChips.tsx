interface Props {
  names: string[];
  /** Shows only this many labels and a "+n" for the rest. */
  limit?: number;
}

export function UserGroupChips({ names, limit }: Props) {
  const shown = limit === undefined ? names : names.slice(0, limit);
  const hidden = names.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((name) => (
        <span key={name} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-brand-ink">
          {name}
        </span>
      ))}
      {hidden > 0 ? (
        <span
          title={names.slice(shown.length).join(", ")}
          className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  );
}
