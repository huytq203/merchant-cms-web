"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ResultState } from "@/components/page/ResultState";
import { Button } from "@/components/ui/button/Button";

type Props = { message: string; compact?: boolean };

/** One dashboard region failed; the others keep working. Retry re-renders the page on the server. */
export function RegionError({ message, compact = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const retry = () => startTransition(() => router.refresh());
  if (compact) {
    return (
      <div role="alert" aria-busy={pending} className="flex flex-wrap items-center gap-3 p-5 text-sm text-muted-foreground">
        <span>{message}</span>
        <Button type="button" variant="outline" size="sm" onClick={retry}>Thử lại</Button>
      </div>
    );
  }
  return (
    <div aria-busy={pending}>
      <ResultState state="error" errorMessage={message} onRetry={retry} />
    </div>
  );
}
