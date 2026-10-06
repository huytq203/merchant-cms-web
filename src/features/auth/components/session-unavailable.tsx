"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button/Button";

export function SessionUnavailable() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section role="alert" className="space-y-4 text-center">
        <p>Không kết nối được máy chủ. Vui lòng thử lại.</p>
        <Button type="button" onClick={() => router.refresh()}>Thử lại</Button>
      </section>
    </main>
  );
}
