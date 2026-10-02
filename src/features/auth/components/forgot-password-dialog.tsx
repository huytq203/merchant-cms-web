"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/Dialog";
import { Form, FormField } from "@/components/ui/form/Form";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import { useForgotPasswordMutation } from "@/features/auth/hooks/use-forgot-password-mutation";

const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập username hoặc email"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
}: ForgotPasswordDialogProps) {
  const forgotMutation = useForgotPasswordMutation();
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { username: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setMessage(null);
    forgotMutation.mutate(
      { username: values.username },
      {
        onSuccess: (result) => {
          if (result.success) {
            setMessage({ type: "success", text: result.message });
            form.reset();
            setTimeout(() => onOpenChange(false), 2000);
            return;
          }

          setMessage({ type: "error", text: result.message });
          toast.error(result.message);
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Không thể reset mật khẩu. Vui lòng thử lại.";

          setMessage({ type: "error", text: errorMessage });
          toast.error(errorMessage);
        },
      },
    );
  });

  const busy = form.formState.isSubmitting || forgotMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Quên mật khẩu?</DialogTitle>
          <DialogDescription>
            Nhập username hoặc email của bạn để reset mật khẩu về 111111
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field, fieldState }) => (
                <Input
                  label="Username hoặc Email"
                  type="text"
                  placeholder="Nhập username hoặc email"
                  icon={<Mail className="w-4 h-4" />}
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />

            {message && (
              <p
                role={message.type === "error" ? "alert" : "status"}
                className={`rounded-md border px-3 py-2 text-sm ${
                  message.type === "success"
                    ? "border-success/30 bg-success-soft text-success"
                    : "border-danger/30 bg-danger-soft text-danger"
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  setMessage(null);
                }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={busy}
                isLoading={busy}
              >
                Reset mật khẩu
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
