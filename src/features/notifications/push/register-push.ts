import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getId, getInstallations } from "firebase/installations";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";

export type PushResult = "granted" | "denied" | "unsupported";

/** Proxy của Portal tới flexpay.notification (`/notification/register-token` và `/unregister-token`). */
const PROXY_PATH = "/api/v1/admin/notifications/push-token";
const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";
/** Khai báo trong notification: bản ghi thiết bị của Portal luôn mang appId này. */
const APP_ID = "merchant-portal";

interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  /** Tùy chọn: thiếu thì getToken dùng khóa VAPID mặc định của Firebase. */
  vapidKey: string;
}

/**
 * Cấu hình web Firebase từ env công khai. Phải viết nguyên văn `process.env.NEXT_PUBLIC_*`
 * thì Next mới nhúng giá trị lúc build; thiếu một biến bắt buộc là coi như chưa cấu hình.
 * `NEXT_PUBLIC_FIREBASE_VAPID_KEY` là tùy chọn (chưa tạo được khóa VAPID tùy chỉnh thì dùng khóa mặc định của Firebase).
 */
function readConfig(): FirebaseWebConfig | null {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
  };
  // vapidKey không bắt buộc nên không tính vào điều kiện đủ cấu hình.
  const { apiKey, authDomain, projectId, messagingSenderId, appId } = config;
  return [apiKey, authDomain, projectId, messagingSenderId, appId].every(Boolean) ? config : null;
}

/** Có đủ cấu hình Firebase để hiện nút bật thông báo (chưa kiểm tra trình duyệt). */
export function isPushConfigured(): boolean {
  return readConfig() !== null;
}

/** Trình duyệt có Notification API và service worker (SSR không có). */
function hasBrowserApis(): boolean {
  return typeof window !== "undefined" && typeof Notification !== "undefined" && "serviceWorker" in navigator;
}

function firebaseApp(config: FirebaseWebConfig): FirebaseApp {
  return (
    getApps()[0] ??
    initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    })
  );
}

/** Lấy token FCM và installation id của trình duyệt này. */
async function resolveDevice(config: FirebaseWebConfig) {
  const app = firebaseApp(config);
  // SW tự xử lý sự kiện push nên không cần cấu hình Firebase; chỉ cần đăng ký đúng phạm vi gốc.
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  const messaging = getMessaging(app);
  // Chỉ truyền vapidKey khi có cấu hình; bỏ trống để Firebase dùng khóa mặc định.
  const token = await getToken(messaging, {
    serviceWorkerRegistration: registration,
    ...(config.vapidKey ? { vapidKey: config.vapidKey } : {}),
  });
  const installationId = await getId(getInstallations(app));
  return { messaging, token, installationId };
}

async function callProxy(method: "POST" | "DELETE", body: Record<string, string>) {
  const response = await fetch(PROXY_PATH, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Không gọi được ${PROXY_PATH}: ${response.status}`);
}

/**
 * Bật push trình duyệt cho user đang đăng nhập.
 * - Mặc định xin quyền (chỉ gọi từ thao tác của user, không bao giờ lúc tải trang).
 * - `silent`: không bao giờ hiện hộp thoại; chỉ làm mới token khi quyền đã được cấp từ trước
 *   (dùng sau khi đăng nhập để token của phiên mới được gắn vào user).
 */
export async function registerPush(options: { silent?: boolean } = {}): Promise<PushResult> {
  const config = readConfig();
  if (!config || !hasBrowserApis() || !(await isSupported())) return "unsupported";

  let permission = Notification.permission;
  if (permission === "default" && !options.silent) permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const { token, installationId } = await resolveDevice(config);
  await callProxy("POST", { token, installationId, platform: "WEB", appId: APP_ID });
  return "granted";
}

/**
 * Gỡ token của trình duyệt này khỏi user hiện tại; gọi TRƯỚC khi xóa phiên vì proxy cần access token.
 * Không bao giờ ném lỗi: thất bại không được chặn việc đăng xuất.
 */
export async function unregisterPush(): Promise<void> {
  try {
    const config = readConfig();
    if (!config || !hasBrowserApis() || Notification.permission !== "granted" || !(await isSupported())) return;
    const { messaging, token, installationId } = await resolveDevice(config);
    await callProxy("DELETE", { token, installationId });
    await deleteToken(messaging);
  } catch {
    // Đăng xuất vẫn tiếp tục; BE tự gỡ token mồ côi khi FCM trả lỗi.
  }
}
