import "server-only";

import { readAccessToken } from "@/lib/auth/session-cookies";
import type { BeResult } from "@/lib/be/client";
import { classifyFetchError, toBeError, type BeError } from "@/lib/be/errors";
import { getServerEnv } from "@/lib/env/server";
import { fail, ok } from "@/lib/http/result";
import type { PushTokenInput } from "@/features/notifications/schemas";

// flexpay.notification trả `LegacyResponse {message, data, code}` chứ không phải envelope `success`
// của các service merchant, nên không dùng được BeClient; gọi fetch trực tiếp với token của user.
const REGISTER_PATH = "/notification/register-token";
const UNREGISTER_PATH = "/notification/unregister-token";
const TIMEOUT_MS = 15_000;

const NOT_CONFIGURED: BeError = {
  status: 503,
  code: "NOTIFICATION_NOT_CONFIGURED",
  message: "Chưa cấu hình dịch vụ thông báo, vui lòng thử lại sau",
};

/** Chuyển tiếp tới notification bằng chính access token của user (notification định danh người nhận theo JWT). */
async function forward(path: string, body: PushTokenInput): Promise<BeResult<undefined>> {
  const baseUrl = getServerEnv().NOTIFICATION_BASE_URL;
  if (!baseUrl) return fail(NOT_CONFIGURED, NOT_CONFIGURED.code);

  const headers = new Headers({ Accept: "application/json", "Content-Type": "application/json" });
  const token = await readAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const failure = classifyFetchError(error);
    return fail(failure, failure.code);
  }
  if (!response.ok) {
    // Bỏ qua body của upstream: thông báo của notification là tiếng Anh, client chỉ nhận câu theo status.
    const error = toBeError(response.status, undefined);
    return fail(error, error.code);
  }
  return ok(undefined);
}

/** Đăng ký token FCM của trình duyệt cho user đang đăng nhập. */
export function registerPushToken(body: PushTokenInput): Promise<BeResult<undefined>> {
  return forward(REGISTER_PATH, body);
}

/** Gỡ token FCM (khi đăng xuất) để thiết bị không nhận push của tài khoản cũ. */
export function unregisterPushToken(body: PushTokenInput): Promise<BeResult<undefined>> {
  return forward(UNREGISTER_PATH, body);
}
