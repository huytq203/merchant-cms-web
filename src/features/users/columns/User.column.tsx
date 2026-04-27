"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "../types/type";
import { Button, Text } from "@/components/ui";
import { SubMerchantDetailModal } from "../components/SubMerchantDetailModal";
import { Badge } from "@/components/ui/badge/Badge";
import { UserStatus } from "../constants/User.constant";
import { useRouter } from "next/navigation";
import { DialogReset } from "../components/DialogReset";
import { DialogLock } from "../components/DialogLock";
import { KeyRound, Lock, Pencil } from "lucide-react";
import { useLockUser } from "../hooks/use-mutation";

export const useUserColumns = (): ColumnDef<User>[] => {
  return [
    {
      accessorKey: "name",
      header: "Tên",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col space-y-1">
            <Text className="text-sm font-medium">{user.name}</Text>
            <Text className="text-xs text-muted-foreground">{user.email}</Text>
          </div>
        );
      },
    },
    {
      accessorKey: "permissionGroupName",
      header: "Số điện thoại",
    },
    {
      accessorKey: "assignedSubMerchantsIds",
      header: "Phạm vi Sub Merchant",
      meta: { align: "center" },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <SubMerchantDetailModal
            merchantIds={user.assignedSubMerchantsIds}
            userName={user.name}
          />
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const user = row.original;
        const statusVariant = user.status === UserStatus.ACTIVE ? "soft-primary" : "soft-danger";
        const statusLabel =
          user.status === UserStatus.ACTIVE ? "Hoạt động" :
          user.status === "locked" ? "Bị khóa" : "Bị vô hiệu hóa";
        return (
          <Badge variant={statusVariant}>
            {statusLabel}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }) => {
        const user = row.original;
        return <UserActionsCell user={user} />;
      },
    },
  ];
};

function UserActionsCell({ user }: { user: User }) {
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const { mutate: lockMutate, isPending: isLocking } = useLockUser();

  function handleResetConfirm(userId: string) {
    // TODO: gọi API reset mật khẩu
    console.log("reset password for", userId);
    setResetOpen(false);
  }

  function handleLockConfirm(userId: string, reason: string) {
    lockMutate({ userId, lockReason: reason }, {
      onSuccess: () => setLockOpen(false),
    });
  }

  return (
    <>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => router.push(`/users/${user.id}`)}
        title="Chỉnh sửa"
      >
        <span title="Chỉnh sửa"><Pencil className="h-4 w-4" /></span>
        
      </Button>

      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => setLockOpen(true)}
        title="Khóa tài khoản"
        disabled={user.status === "locked"}
      >
        <span title="Khóa tài khoản"><Lock className="h-4 w-4" /></span>
        
      </Button>

      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => setResetOpen(true)}
        title="Cấp lại mật khẩu"
      >
        <span title="Cấp lại mật khẩu"><KeyRound className="h-4 w-4" /></span>
      </Button>

      <DialogReset
        user={user}
        open={resetOpen}
        onOpenChange={setResetOpen}
        onConfirm={handleResetConfirm}
      />

      <DialogLock
        user={user}
        open={lockOpen}
        onOpenChange={setLockOpen}
        onConfirm={handleLockConfirm}
        isLoading={isLocking}
      />
    </>
  );
}
