import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OrderFormData } from "../schemas/order.schema";
import { orderRequest } from "../order-api";
import type { Order } from "../types/types";

function useOrderMutation<TVariables>(
  request: (variables: TVariables) => Promise<Order>,
  successMessage: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: async (order) => {
      client.setQueryData(["orders", "detail", order.id], order);
      await client.invalidateQueries({ queryKey: ["orders", "list"] });
      toast.success(successMessage);
    },
  });
}

/** Re-submitting while a request is in flight returns that same request, so one click-pair makes one order. */
export function useCreateOrder() {
  const inFlight = useRef<Promise<Order> | null>(null);
  const mutation = useOrderMutation(
    (values: OrderFormData) => orderRequest<Order>("", { method: "POST", body: JSON.stringify(values) }),
    "Tạo đơn hàng thành công",
  );
  const create = (values: OrderFormData): Promise<Order> => {
    if (inFlight.current) return inFlight.current;
    const request = mutation.mutateAsync(values).finally(() => {
      inFlight.current = null;
    });
    inFlight.current = request;
    return request;
  };
  return { create, isPending: mutation.isPending, error: mutation.error, reset: mutation.reset };
}

export function useRefreshOrderQr() {
  const mutation = useOrderMutation(
    (id: string) => orderRequest<Order>(`/${encodeURIComponent(id)}/refresh-qr`, { method: "POST" }),
    "Đã làm mới mã QR",
  );
  return {
    refresh: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
  };
}
