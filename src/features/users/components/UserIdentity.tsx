import { cn } from "@/lib/utils/cn";
import { getInitials } from "../utils/user-restrictions";

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-brand-ink", className)}
    >
      {getInitials(name)}
    </span>
  );
}

interface Props {
  name: string;
  email: string;
  className?: string;
}

/** Monogram, name and email stacked the same way in the table and in dialogs. */
export function UserIdentity({ name, email, className }: Props) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <UserAvatar name={name} />
      <div className="min-w-0 leading-tight">
        <p className="truncate font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}
