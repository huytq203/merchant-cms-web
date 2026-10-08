"use client";

import { Info, Store } from "lucide-react";
import { DetailSection } from "@/components/modal/DetailModal";
import { FormModal } from "@/components/modal/FormModal";
import { usePermissionGroups } from "@/features/permission/permission-group-queries";
import { useUserForm } from "../hooks/use-user-form";
import type { MerchantUser, UserFormValues } from "../schemas/user.schema";
import { merchantLabel } from "../utils/user-mapper";
import { UserBasicFields } from "./UserFormFields";
import { UserGroupPicker } from "./UserGroupPicker";
import { UserScopeItems } from "./UserScopeItems";
import { UserScopePicker } from "./UserScopePicker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  /** Every merchant id in the session. */
  merchantIds: string[];
  actorId?: string;
  user?: MerchantUser | null;
  isSubmitting: boolean;
  emailError?: string;
  error?: string;
  onSubmit: (values: UserFormValues) => void;
}

function SelfEditBanner() {
  return (
    <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        <b className="font-semibold">Bạn không thể sửa chính mình.</b> Nhờ một quản trị viên khác cập nhật tài khoản này.
      </span>
    </div>
  );
}

function ExistingScope({ user, merchantIds }: { user: MerchantUser; merchantIds: string[] }) {
  return (
    <DetailSection title="Phạm vi truy cập" icon={<Store className="h-4 w-4" />}>
      <UserScopeItems user={user} merchantIds={merchantIds} />
      <p className="text-xs text-muted-foreground">Phạm vi chỉ được xem tại đây và không thể tạo mới.</p>
    </DetailSection>
  );
}

function UserFormModal({ onOpenChange, merchantId, merchantIds, actorId, user, isSubmitting, emailError, error, onSubmit }: Omit<Props, "open">) {
  const form = useUserForm(user, merchantId, onSubmit);
  const groups = usePermissionGroups({ page: 1, pageSize: 100 });
  const isSelf = Boolean(user && actorId && user.id === actorId);

  return (
    <FormModal
      open
      onOpenChange={onOpenChange}
      size="lg"
      title={user ? "Cập nhật người dùng" : "Thêm người dùng"}
      description={user ? "Đổi thông tin liên hệ và nhóm quyền." : "Nhập thông tin, chọn nhóm quyền và phạm vi truy cập."}
      submitLabel={user ? "Lưu thay đổi" : "Thêm người dùng"}
      isSubmitting={isSubmitting}
      submitDisabled={isSelf || groups.isPending || groups.isError}
      error={error}
      onSubmit={form.submit}
    >
      {isSelf ? <SelfEditBanner /> : null}
      <UserBasicFields form={form} isEdit={Boolean(user)} readOnly={isSelf} emailError={emailError} />
      <UserGroupPicker form={form} groups={groups} locked={isSelf} />
      {user ? (
        <ExistingScope user={user} merchantIds={merchantIds} />
      ) : (
        <UserScopePicker form={form} merchantName={merchantLabel(merchantIds, merchantId)} />
      )}
    </FormModal>
  );
}

/** Form state lives only while the modal is open, so each opening starts from the chosen user. */
export function UserModal({ open, user, ...rest }: Props) {
  if (!open) return null;
  return <UserFormModal key={user?.id ?? "create"} user={user} {...rest} />;
}
