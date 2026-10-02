import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createBeClient } from "@/lib/be/client";
import { emptySchema } from "@/lib/be/envelope";
import { mswServer } from "@/test/msw";

const BASE = "https://be.test";
const client = createBeClient({ baseUrl: BASE, getAccessToken: async () => "tok-1" });
const envelope = (data: unknown) => ({
  success: true,
  status: "1000",
  message: "success",
  detail: "ok",
  data,
});
const userSchema = z.object({ id: z.string(), name: z.string() });

describe("createBeClient", () => {
  it("parses a successful envelope through the schema", async () => {
    mswServer.use(
      http.get(`${BASE}/u`, () => HttpResponse.json(envelope({ id: "1", name: "An", extra: 1 }))),
    );
    const result = await client.get({ path: "/u", schema: userSchema });
    expect(result).toEqual({ success: true, data: { id: "1", name: "An" } });
  });

  it("sends the bearer token by default and omits it when auth is false", async () => {
    const seen: (string | null)[] = [];
    mswServer.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        seen.push(request.headers.get("authorization"));
        return HttpResponse.json(envelope(null));
      }),
    );
    await client.get({ path: "/ping", schema: emptySchema });
    await client.get({ path: "/ping", schema: emptySchema, auth: false });
    expect(seen).toEqual(["Bearer tok-1", null]);
  });

  it("serialises query params and skips undefined and null", async () => {
    let url = "";
    mswServer.use(
      http.get(`${BASE}/list`, ({ request }) => {
        url = request.url;
        return HttpResponse.json(envelope(null));
      }),
    );
    await client.get({
      path: "/list",
      schema: emptySchema,
      query: { page: 2, q: "an", skip: undefined, none: null, flag: false },
    });
    expect(new URL(url).searchParams.toString()).toBe("page=2&q=an&flag=false");
  });

  it("maps an HTTP error body to a BeError", async () => {
    mswServer.use(
      http.post(`${BASE}/login`, () =>
        HttpResponse.json(
          { success: false, message: "INVALID_CREDENTIALS", detail: "Sai mật khẩu", status: "4001" },
          { status: 401 },
        ),
      ),
    );
    const result = await client.post({ path: "/login", schema: emptySchema, body: {} });
    expect(result).toMatchObject({
      success: false,
      error: { status: 401, code: "INVALID_CREDENTIALS", message: "Sai mật khẩu" },
    });
  });

  it("treats a 200 whose envelope says success=false as an error", async () => {
    mswServer.use(
      http.get(`${BASE}/x`, () =>
        HttpResponse.json({ success: false, message: "LOCKED", detail: "Tài khoản bị khóa" }),
      ),
    );
    const result = await client.get({ path: "/x", schema: emptySchema });
    expect(result).toMatchObject({ success: false, error: { code: "LOCKED", message: "Tài khoản bị khóa" } });
  });

  it("returns INVALID_RESPONSE when data does not match the schema", async () => {
    mswServer.use(http.get(`${BASE}/u`, () => HttpResponse.json(envelope({ id: 1 }))));
    const result = await client.get({ path: "/u", schema: userSchema });
    expect(result).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("returns NETWORK when the connection fails", async () => {
    mswServer.use(http.get(`${BASE}/down`, () => HttpResponse.error()));
    const result = await client.get({ path: "/down", schema: emptySchema });
    expect(result).toMatchObject({ success: false, error: { status: 0, code: "NETWORK" } });
  });


  it("accepts a success envelope that omits the data key", async () => {
    mswServer.use(
      http.post(`${BASE}/forgot`, () => HttpResponse.json({ success: true, message: "success", detail: "ok" })),
    );
    const result = await client.post({ path: "/forgot", schema: emptySchema, body: {} });
    expect(result).toEqual({ success: true, data: undefined });
  });
  it("accepts an empty 204 body for emptySchema", async () => {
    mswServer.use(http.post(`${BASE}/logout`, () => new HttpResponse(null, { status: 204 })));
    const result = await client.post({ path: "/logout", schema: emptySchema });
    expect(result).toEqual({ success: true, data: undefined });
  });
});
