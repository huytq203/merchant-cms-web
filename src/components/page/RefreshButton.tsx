"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button/Button";

interface Props {
  label?: string;
}

/** Re-renders the current server page, for data the server reads live on every request. */
export function RefreshButton({ label = "Làm mới" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button type="button" variant="outline" isLoading={isPending} onClick={() => startTransition(() => router.refresh())}>
      {label}
    </Button>
  );
}
