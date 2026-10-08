"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { useCreateScopeProposal } from "../hooks/use-scope-proposal";
import { scopeProposalFormSchema, type MerchantUser } from "../schemas/user.schema";

interface Props {
  user: Pick<MerchantUser, "id" | "subMerchantIds">;
  onDone: () => void;
}

function SubMerchantChoices({ picked, onToggle }: { picked: string[]; onToggle: (id: string, checked: boolean) => void }) {
  const options = useSubMerchantOptions();

  if (options.isPending) return <p role="status" className="text-sm text-muted-foreground">Đang tải sub-merchant</p>;
  if (options.isError) return <p role="alert" className="text-sm text-danger">Không tải được sub-merchant</p>;
  return (
    <fieldset aria-label="Sub-merchant muốn truy cập" className="grid max-h-40 gap-1.5 overflow-y-auto rounded-xl border border-border bg-background p-2">
      {options.data.map((option) => (
        <Checkbox
          key={option.id}
          label={`${option.code} · ${option.name}`}
          checked={picked.includes(option.id)}
          onCheckedChange={(next) => onToggle(option.id, next === true)}
        />
      ))}
    </fieldset>
  );
}

/** Requests a scope change; the BE applies it only after someone else approves. */
export function UserScopeProposalForm({ user, onDone }: Props) {
  const create = useCreateScopeProposal();
  const [picked, setPicked] = useState<string[]>(user.subMerchantIds);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const send = async () => {
    const parsed = scopeProposalFormSchema.safeParse({ subMerchantIds: picked, reason });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    setError(undefined);
    try {
      await create.mutateAsync({ id: user.id, values: parsed.data });
      onDone();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không gửi được đề xuất");
    }
  };

  return (
    <div className="space-y-3 border-t border-dashed border-border pt-3">
      <SubMerchantChoices
        picked={picked}
        onToggle={(id, checked) => setPicked((current) => (checked ? [...current, id] : current.filter((value) => value !== id)))}
      />
      <Textarea
        label="Lý do đề xuất"
        required
        placeholder="Ví dụ: nhân viên chuyển sang phụ trách thêm cửa hàng mới"
        maxLength={500}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        error={error}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Hủy</Button>
        <Button type="button" variant="outline" size="sm" disabled={create.isPending} onClick={() => void send()}>
          {create.isPending ? "Đang gửi" : "Gửi đề xuất"}
        </Button>
      </div>
    </div>
  );
}
