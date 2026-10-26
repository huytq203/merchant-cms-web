"use client";

import { ShieldCheck } from "lucide-react";
import { DetailSection } from "@/components/modal/DetailModal";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import type { useAssignableGroups } from "../user-queries";
import { cn } from "@/lib/utils/cn";
import type { UserForm } from "../hooks/use-user-form";

interface Props {
  form: UserForm;
  groups: ReturnType<typeof useAssignableGroups>;
  /** Locks the choice, used when the actor edits their own account. */
  locked: boolean;
}

function selectedLabel(count: number): string {
  return count > 0 ? `Đã chọn ${count}` : "Chọn ít nhất một nhóm";
}

function GroupMessage({ groups }: Pick<Props, "groups">) {
  if (groups.isPending) return <p role="status" className="text-sm text-muted-foreground">Đang tải nhóm quyền</p>;
  if (groups.isError) return <p role="alert" className="text-sm text-danger">Không tải được nhóm quyền</p>;
  if (groups.data.length === 0) return <p className="text-sm text-muted-foreground">Bạn chưa có nhóm quyền nào được phép gán</p>;
  return null;
}

export function UserGroupPicker({ form, groups, locked }: Props) {
  const error = form.issues.groupIds;
  const selected = form.values.groupIds;

  return (
    <DetailSection title="Nhóm quyền" icon={<ShieldCheck className="h-4 w-4" />} aside={selectedLabel(selected.length)} bare>
      <fieldset
        aria-label="Nhóm quyền"
        aria-describedby={error ? "user-groups-error" : undefined}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {groups.data?.map((group) => {
          const checked = selected.includes(group.id);
          return (
            <div
              key={group.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2",
                checked && "border-brand bg-muted",
              )}
            >
              <Checkbox
                label={group.name}
                checked={checked}
                disabled={locked}
                onCheckedChange={(next) => form.toggle("groupIds", group.id, next === true)}
              />
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{group.permissions.length} quyền</span>
            </div>
          );
        })}
      </fieldset>
      <GroupMessage groups={groups} />
      {error ? <p id="user-groups-error" role="alert" className="text-xs font-medium text-danger">{error}</p> : null}
    </DetailSection>
  );
}
