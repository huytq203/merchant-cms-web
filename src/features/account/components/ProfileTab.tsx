"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { updateProfileSchema, type UpdateProfileInput } from "../schemas";
import { useUpdateProfileMutation } from "../hooks/use-update-profile-mutation";
import type { SessionUser } from "@/types/auth";

interface ProfileTabProps {
  user: SessionUser;
}

function getInitial(text: string): string {
  return text.charAt(0).toUpperCase();
}

export function ProfileTab({ user }: ProfileTabProps) {
  const { mutate, isPending } = useUpdateProfileMutation();
  const displayEmail = user.email ?? user.username;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user.username, phone: user.phone ?? "" },
  });

  const onSubmit = handleSubmit((data) => {
    mutate(data, {
      onSuccess: () => toast.success("Cập nhật thông tin thành công"),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Cập nhật thất bại"),
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-primary select-none">
            {getInitial(displayEmail)}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Thay đổi ảnh</p>
          <p className="text-xs text-muted-foreground">JPG, PNG tối đa 5MB</p>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          {...register("fullName")}
          label="HỌ VÀ TÊN"
          placeholder="Nhập họ và tên"
          error={errors.fullName?.message}
        />
        <Input
          label="VAI TRÒ"
          value={user.permissionName}
          readOnly
          disabled
          className="bg-muted/50"
        />
      </div>

      <Input
        label="EMAIL ĐĂNG NHẬP"
        value={displayEmail}
        readOnly
        disabled
        className="bg-muted/50"
      />

      <Input
        {...register("phone")}
        label="SỐ ĐIỆN THOẠI LIÊN HỆ"
        placeholder="Nhập số điện thoại liên hệ"
        error={errors.phone?.message}
      />

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isPending}>
          Lưu thông tin
        </Button>
      </div>
    </form>
  );
}
