import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/http/api-client";
import { terminalApiRoot } from "../constants/terminal.constants";
import type { TerminalFormValues } from "../schemas";
import type { TerminalDetail } from "../types";

type ReasonValues = { id: string; reason: string };

function itemPath(id: string, action = ""): string {
  return `${terminalApiRoot}/${encodeURIComponent(id)}${action}`;
}

function useTerminalMutation<TVariables>(
  request: (values: TVariables) => Promise<TerminalDetail>,
  successMessage: string,
) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: request,
    onSuccess: async (detail) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["terminals", "list"] }),
        client.invalidateQueries({ queryKey: ["terminals", "detail", detail.id] }),
      ]);
      toast.success(successMessage);
    },
  });
  return {
    mutate: mutation.mutateAsync,
    reset: mutation.reset,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useSaveTerminal(id?: string) {
  return useTerminalMutation(
    (values: TerminalFormValues) => id
      ? apiClient.put<TerminalDetail>(itemPath(id), values)
      : apiClient.post<TerminalDetail>(terminalApiRoot, values),
    "Lưu Terminal thành công",
  );
}

export function useLockTerminal() {
  return useTerminalMutation(
    ({ id, reason }: ReasonValues) => apiClient.post<TerminalDetail>(itemPath(id, "/lock"), { reason }),
    "Khóa Terminal thành công",
  );
}

export function useUnlockTerminal() {
  return useTerminalMutation(
    ({ id, reason }: ReasonValues) => apiClient.post<TerminalDetail>(itemPath(id, "/unlock"), { reason }),
    "Mở khóa Terminal thành công",
  );
}
