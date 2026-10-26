import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { NOTIFICATIONS_ENDPOINT, NOTIFICATIONS_KEY } from "../notification-queries";
import type { Notification, ReadAllResult } from "../types";

/** A failed write shows the app's error toast; a success is visible in the list itself, so it stays silent. */
const ERROR_TOAST = { error: true } as const;

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<Notification>(`${NOTIFICATIONS_ENDPOINT}/${id}/read`, undefined, { toast: ERROR_TOAST }),
    onSuccess: () => client.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<ReadAllResult>(`${NOTIFICATIONS_ENDPOINT}/read-all`, undefined, { toast: ERROR_TOAST }),
    onSuccess: () => client.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
