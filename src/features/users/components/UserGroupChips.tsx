export interface GroupChipItem {
  id: string;
  name: string;
  /** When present the chip reads "Sale · 4 quyền". */
  permissionCount?: number;
}

interface Props {
  /** Plain labels (scopes, legacy callers); two equal labels are two chips, keyed by position. */
  names?: string[];
  /** Groups with their id: the id is the chip key, so two groups with the same name stay two chips. */
  items?: GroupChipItem[];
  /** Shows only this many labels and a "+n" for the rest. */
  limit?: number;
}

export function UserGroupChips({ names = [], items, limit }: Props) {
  const all = items
    ? items.map((item) => ({
      key: item.id,
      label: item.permissionCount === undefined ? item.name : `${item.name} · ${item.permissionCount} quyền`,
    }))
    : names.map((name, index) => ({ key: `${index}:${name}`, label: name }));
  const shown = limit === undefined ? all : all.slice(0, limit);
  const hidden = all.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((chip) => (
        <span key={chip.key} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-brand-ink">
          {chip.label}
        </span>
      ))}
      {hidden > 0 ? (
        <span
          title={all.slice(shown.length).map((chip) => chip.label).join(", ")}
          className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  );
}
