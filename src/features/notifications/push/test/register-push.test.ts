// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { initializeApp, getApps, getMessaging, getToken, deleteToken, isSupported, getInstallations, getId } = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ name: "app" })),
  getApps: vi.fn(() => [] as unknown[]),
  getMessaging: vi.fn(() => ({ name: "messaging" })),
  getToken: vi.fn(),
  deleteToken: vi.fn(),
  isSupported: vi.fn(),
  getInstallations: vi.fn(() => ({ name: "installations" })),
  getId: vi.fn(),
}));
vi.mock("firebase/app", () => ({ initializeApp, getApps }));
vi.mock("firebase/messaging", () => ({ getMessaging, getToken, deleteToken, isSupported }));
vi.mock("firebase/installations", () => ({ getInstallations, getId }));

import { isPushConfigured, registerPush, unregisterPush } from "../register-push";

const PROXY = "/api/v1/admin/notifications/push-token";
const fetchMock = vi.fn();
const requestPermission = vi.fn();
const registerSw = vi.fn();

function stubBrowser(permission: NotificationPermission) {
  vi.stubGlobal("Notification", Object.assign(function () {}, { permission, requestPermission }));
  Object.defineProperty(navigator, "serviceWorker", { value: { register: registerSw }, configurable: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "key");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "p.firebaseapp.com");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "p");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "123");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "1:123:web:abc");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "vapid");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response(JSON.stringify(true), { status: 200 }));
  isSupported.mockResolvedValue(true);
  getToken.mockResolvedValue("fcm-token");
  getId.mockResolvedValue("install-1");
  registerSw.mockResolvedValue({ scope: "/" });
  requestPermission.mockResolvedValue("granted");
  stubBrowser("default");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("registerPush", () => {
  it("posts the token to the proxy with the exact body once permission is granted", async () => {
    expect(await registerPush()).toBe("granted");
    expect(requestPermission).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(PROXY);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      token: "fcm-token",
      installationId: "install-1",
      platform: "WEB",
      appId: "merchant-portal",
    });
  });

  it("registers the Portal service worker at the site root", async () => {
    await registerPush();
    expect(registerSw).toHaveBeenCalledWith("/firebase-messaging-sw.js");
  });

  it("returns denied and never calls the proxy when the user refuses", async () => {
    requestPermission.mockResolvedValue("denied");
    expect(await registerPush()).toBe("denied");
    expect(getToken).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not ask again when the browser already blocks notifications", async () => {
    stubBrowser("denied");
    expect(await registerPush()).toBe("denied");
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("returns unsupported without prompting when the Firebase config is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "");
    expect(isPushConfigured()).toBe(false);
    expect(await registerPush()).toBe("unsupported");
    expect(requestPermission).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns unsupported when the browser has no Notification API or Firebase messaging", async () => {
    isSupported.mockResolvedValue(false);
    expect(await registerPush()).toBe("unsupported");
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("silent mode never prompts and does nothing unless permission was already granted", async () => {
    expect(await registerPush({ silent: true })).toBe("denied");
    expect(requestPermission).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    stubBrowser("granted");
    expect(await registerPush({ silent: true })).toBe("granted");
    expect(requestPermission).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not report granted when the proxy rejects the token", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 502 }));
    await expect(registerPush()).rejects.toThrow();
  });
});

describe("unregisterPush", () => {
  it("sends the token to the proxy with DELETE and drops it from Firebase", async () => {
    stubBrowser("granted");
    await unregisterPush();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(PROXY);
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body as string)).toEqual({ token: "fcm-token", installationId: "install-1" });
    expect(deleteToken).toHaveBeenCalledTimes(1);
  });

  it("does nothing when this browser never opted in", async () => {
    await unregisterPush();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("never throws, so a failure cannot block signing out", async () => {
    stubBrowser("granted");
    fetchMock.mockRejectedValue(new Error("network"));
    await expect(unregisterPush()).resolves.toBeUndefined();
  });
});
