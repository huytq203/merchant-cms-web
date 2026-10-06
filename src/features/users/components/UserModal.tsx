"use client";

import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { usePermissionGroups } from "@/features/permission/permission-group-queries";
import { useUserForm } from "../hooks/use-user-form";
import type { MerchantUser, UserFormValues } from "../schemas/user.schema";
import { UserBasicFields, UserGroupFieldset, UserSubMerchantFieldset } from "./UserFormFields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  actorId?: string;
  user?: MerchantUser | null;
  isSubmitting: boolean;
  emailError?: string;
  error?: string;
  onSubmit: (values: UserFormValues) => void;
}

export function UserModal({ open, onOpenChange, merchantId, actorId, user, isSubmitting, emailError, error, onSubmit }: Props) {
  const form = useUserForm(user, merchantId, onSubmit);
  const groups = usePermissionGroups({ page: 1, pageSize: 100 });
  const isEdit = Boolean(user);
  const isSelf = Boolean(user && actorId && user.id === actorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật người dùng" : "Thêm người dùng"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.submit} className="space-y-5">
          <UserBasicFields form={form} isEdit={isEdit} emailError={emailError} />
          <UserGroupFieldset form={form} groups={groups} locked={isSelf} />
          <UserSubMerchantFieldset form={form} isEdit={isEdit} />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
            <Button type="submit" variant="solid" disabled={isSubmitting || groups.isPending || groups.isError}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
