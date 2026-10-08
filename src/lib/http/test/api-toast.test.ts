// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { mswServer } from "@/test/msw";
import { apiClient } from "@/lib/http/api-client";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const url = `${window.location.origin}/api/v1/things`;
const withMessage = (message: string) => ({ headers: { "X-Api-Message": encodeURIComponent(message) } });

beforeEach(() => {
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("global API toast", () => {
  it("shows the decoded BE message after a write", async () => {
    mswServer.use(http.put(url, () => HttpResponse.json({ ok: true }, withMessage("Đã cập nhật"))));
    await apiClient.put("/v1/things", {});
    expect(toast.success).toHaveBeenCalledWith("Đã cập nhật");
  });

  it("stays silent for reads and for responses without a message", async () => {
    mswServer.use(
      http.get(url, () => HttpResponse.json({}, withMessage("Get success"))),
      http.post(url, () => HttpResponse.json({})),
    );
    await apiClient.get("/v1/things");
    await apiClient.post("/v1/things", {});
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("uses the caller's fallback only when the BE sent no message", async () => {
    mswServer.use(
      http.post(url, () => HttpResponse.json({})),
      http.put(url, () => HttpResponse.json({}, withMessage("Từ BE"))),
    );
    await apiClient.post("/v1/things", {}, { toast: { fallback: "Dự phòng FE" } });
    await apiClient.put("/v1/things", {}, { toast: { fallback: "Dự phòng FE" } });
    expect(toast.success).toHaveBeenNthCalledWith(1, "Dự phòng FE");
    expect(toast.success).toHaveBeenNthCalledWith(2, "Từ BE");
  });

  it("lets a caller replace or suppress the toast", async () => {
    mswServer.use(http.post(url, () => HttpResponse.json({}, withMessage("Create success"))));
    await apiClient.post("/v1/things", {}, { toast: "Đã thêm" });
    await apiClient.post("/v1/things", {}, { toast: false });
    await apiClient.post("/v1/things", {}, { toast: { success: false } });
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Đã thêm");
  });

  it("toasts errors only when asked, with the API message or a custom one", async () => {
    mswServer.use(http.post(url, () => HttpResponse.json({ message: "Email đã tồn tại" }, { status: 409 })));
    await expect(apiClient.post("/v1/things", {})).rejects.toThrow("Email đã tồn tại");
    expect(toast.error).not.toHaveBeenCalled();
    await expect(apiClient.post("/v1/things", {}, { toast: { error: true } })).rejects.toThrow();
    await expect(apiClient.post("/v1/things", {}, { toast: { error: "Không thêm được" } })).rejects.toThrow();
    expect(toast.error).toHaveBeenNthCalledWith(1, "Email đã tồn tại");
    expect(toast.error).toHaveBeenNthCalledWith(2, "Không thêm được");
  });
});
