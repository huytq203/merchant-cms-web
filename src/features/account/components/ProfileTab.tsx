"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { updateProfileSchema, type UpdateProfileInput } from "../schemas";
import { useUpdateProfileMutation } from "../hooks/use-update-profile-mutation";
import type { SessionUser } from "@/types/auth";

interface Props { user: SessionUser }

export function ProfileTab({ user }: Props) {
  const { mutate, isPending } = useUpdateProfileMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user.fullName ?? user.username, phone: user.phone ?? "" },
  });
  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => toast.success("Cập nhật thông tin thành công"),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Cập nhật thất bại"),
    });
  });
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          {...register("fullName")}
          label="Họ và tên"
          placeholder="Ví dụ: Nguyễn Văn A"
          error={errors.fullName?.message}
        />
        <Input
          {...register("phone")}
          label="Số điện thoại"
          placeholder="Ví dụ: 0912345678"
          error={errors.phone?.message}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="solid" isLoading={isPending}>Lưu thông tin</Button>
      </div>
    </form>
  );
}
