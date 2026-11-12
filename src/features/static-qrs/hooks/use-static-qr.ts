"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/http/api-client";
import { staticQrListSchema, staticQrSchema, type StaticQr, type StaticQrScope } from "../schemas";

const ROOT = "/v1/admin/static-qrs";

export const staticQrKeys = {
  all: ["static-qrs"] as const,
  scope: (scope: StaticQrScope) => ["static-qrs", scope.subMerchantId, scope.terminalId ?? null] as const,
};

/** Mã đang dùng của đúng phạm vi: dialog của Sub chỉ lấy mã cấp Sub, không lấy mã gắn Terminal của Sub đó. */
export function pickActive(rows: StaticQr[], scope: StaticQrScope): StaticQr | null {
  return rows.find((qr) => qr.status === "ACTIVE" && (qr.terminalId ?? null) === (scope.terminalId ?? null)) ?? null;
}

/**
 * Đọc và thao tác mã QR tĩnh của một phạm vi (Sub hoặc Terminal). Sau mỗi thao tác làm mới đúng phạm vi đó;
 * lỗi hiện ngay trong dialog (không toast lỗi), thành công báo toast ngắn như các màn quản lý khác.
 */
export function useStaticQr(scope: StaticQrScope, enabled: boolean) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: staticQrKeys.scope(scope),
    enabled,
    queryFn: async () =>
      staticQrListSchema.parse(
        await apiClient.get<unknown>(ROOT, { query: { subMerchantId: scope.subMerchantId, terminalId: scope.terminalId ?? undefined } }),
      ),
  });

  const after = (message: string) => async () => {
    await client.invalidateQueries({ queryKey: staticQrKeys.scope(scope) });
    toast.success(message);
  };
  const create = useMutation({
    mutationFn: async () =>
      staticQrSchema.parse(
        await apiClient.post<unknown>(ROOT, { subMerchantId: scope.subMerchantId, terminalId: scope.terminalId ?? undefined }, { toast: false }),
      ),
    onSuccess: after("Đã tạo mã QR tĩnh"),
  });
  const rotate = useMutation({
    mutationFn: async (id: string) => staticQrSchema.parse(await apiClient.post<unknown>(`${ROOT}/${encodeURIComponent(id)}/rotate`, undefined, { toast: false })),
    onSuccess: after("Đã đổi mã QR tĩnh, mã cũ không dùng được nữa"),
  });
  const disable = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post<unknown>(`${ROOT}/${encodeURIComponent(id)}/disable`, { reason }, { toast: false }),
    onSuccess: after("Đã tắt mã QR tĩnh"),
  });

  return { query, active: query.data ? pickActive(query.data, scope) : null, create, rotate, disable };
}
