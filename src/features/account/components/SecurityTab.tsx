"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { changePasswordSchema, type ChangePasswordInput } from "../schemas";
import { useChangePasswordMutation } from "../hooks/use-change-password-mutation";

export function SecurityTab() {
  const { mutate, isPending } = useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((data) => {
    mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success("Đổi mật khẩu thành công");
          reset();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Đổi mật khẩu thất bại",
          ),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/8 p-3">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p className="text-sm text-info/90">
          Để đảm bảo an toàn, mật khẩu phải có độ dài ít nhất 8 ký tự, bao
          gồm cả chữ cái viết hoa, chữ thường và chữ số.
        </p>
      </div>

      <Input
        {...register("currentPassword")}
        type="password"
        label="MẬT KHẨU HIỆN TẠI"
        placeholder="Nhập mật khẩu đang sử dụng"
        error={errors.currentPassword?.message}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          {...register("newPassword")}
          type="password"
          label="MẬT KHẨU MỚI"
          placeholder="Tối thiểu 8 ký tự"
          error={errors.newPassword?.message}
        />
        <Input
          {...register("confirmPassword")}
          type="password"
          label="XÁC NHẬN MẬT KHẨU"
          placeholder="Nhập lại mật khẩu mới"
          error={errors.confirmPassword?.message}
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isPending}>
          Cập nhật mật khẩu
        </Button>
      </div>
    </form>
  );
}
