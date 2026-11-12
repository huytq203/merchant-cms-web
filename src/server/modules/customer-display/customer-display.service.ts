import "server-only";

import type { z } from "zod";
import { resolveModuleSource } from "@/lib/be/api-mode";
import type { BeResult } from "@/lib/be/client";
import { emptySchema } from "@/lib/be/envelope";
import type { BeError } from "@/lib/be/errors";
import { merchantClient } from "@/lib/be/services";
import { fail, ok } from "@/lib/http/result";
import type { Order } from "@/features/orders/schemas/order.schema";
import {
  customerDisplaySchema,
  customerDisplayStatusSchema,
  withKind,
  type CustomerDisplay,
  type DisplayKind,
  type CustomerDisplayStatus,
} from "@/features/customer-display/schemas";
import { staticQrListSchema, staticQrSchema, type StaticQr, type StaticQrCreate } from "@/features/static-qrs/schemas";
import { customerDisplayPaths, staticQrPaths } from "./customer-display.paths";
import {
  fixtureCreateStaticQr,
  fixtureDisableStaticQr,
  fixtureDisplayStatus,
  fixtureGetStaticQr,
  fixtureListStaticQrs,
  fixtureOrderDisplay,
  fixtureRotateStaticQr,
  fixtureStaticDisplay,
} from "./customer-display.fixture";

/** Dùng dữ liệu giả chỉ khi dev local bật `MERCHANT_API_MODE=fixture`; production luôn gọi BE thật. */
const isFixtureMode = () => resolveModuleSource("customer-display") === "fixture";

const notFound = (message: string): BeResult<never> => {
  const error: BeError = { status: 404, code: "NOT_FOUND", message };
  return fail(error, error.code);
};

/** BE sẽ thêm `kind`; tới lúc đó điền theo API đã gọi để client nhận cùng một dạng. */
async function withKindResult(
  pending: Promise<BeResult<z.output<typeof customerDisplaySchema>>>,
  kind: DisplayKind,
): Promise<BeResult<CustomerDisplay>> {
  const result = await pending;
  return result.success ? ok(withKind(result.data, kind)) : result;
}

/** Mở màn cho một đơn đang chờ: BE trả mã QR, số tiền, phí khách chịu và token hỏi trạng thái. */
export function createOrderDisplay(order: Order): Promise<BeResult<CustomerDisplay>> {
  if (isFixtureMode()) return Promise.resolve(ok(fixtureOrderDisplay(order)));
  return withKindResult(merchantClient().post({ path: customerDisplayPaths.order(order.id), schema: customerDisplaySchema }), "ORDER");
}

export function createStaticQrDisplay(staticQrId: string): Promise<BeResult<CustomerDisplay>> {
  if (isFixtureMode()) {
    const display = fixtureStaticDisplay(staticQrId);
    return Promise.resolve(display ? ok(display) : notFound("Không tìm thấy mã QR tĩnh"));
  }
  return withKindResult(merchantClient().post({ path: customerDisplayPaths.staticQr(staticQrId), schema: customerDisplaySchema }), "STATIC_QR");
}

/** Đường public của BE: không gửi token đăng nhập, quyền đọc nằm trong chính `displayToken`. */
export function getDisplayStatus(displayToken: string): Promise<BeResult<CustomerDisplayStatus>> {
  if (isFixtureMode()) {
    const status = fixtureDisplayStatus(displayToken);
    return Promise.resolve(status ? ok(status) : notFound("Màn hiển thị đã hết hạn"));
  }
  return merchantClient().get({ path: customerDisplayPaths.status(displayToken), schema: customerDisplayStatusSchema, auth: false });
}

export function listStaticQrs(filter: { subMerchantId?: string; terminalId?: string }): Promise<BeResult<StaticQr[]>> {
  if (isFixtureMode()) return Promise.resolve(ok(fixtureListStaticQrs(filter)));
  return merchantClient().get({ path: staticQrPaths.list, schema: staticQrListSchema, query: filter });
}

export function getStaticQr(id: string): Promise<BeResult<StaticQr>> {
  if (isFixtureMode()) {
    const qr = fixtureGetStaticQr(id);
    return Promise.resolve(qr ? ok(qr) : notFound("Không tìm thấy mã QR tĩnh"));
  }
  return merchantClient().get({ path: staticQrPaths.detail(id), schema: staticQrSchema });
}

export function createStaticQr(input: StaticQrCreate): Promise<BeResult<StaticQr>> {
  if (isFixtureMode()) return Promise.resolve(ok(fixtureCreateStaticQr(input)));
  return merchantClient().post({ path: staticQrPaths.create, schema: staticQrSchema, body: input });
}

export function disableStaticQr(id: string, reason: string): Promise<BeResult<StaticQr | undefined>> {
  if (isFixtureMode()) {
    const qr = fixtureDisableStaticQr(id, reason);
    return Promise.resolve(qr ? ok(qr) : notFound("Không tìm thấy mã QR tĩnh"));
  }
  return merchantClient().post({ path: staticQrPaths.disable(id), schema: staticQrSchema.or(emptySchema), body: { reason } });
}

/** Xoay mã: BE tắt bản cũ và trả bản mới cùng phạm vi. */
export function rotateStaticQr(id: string): Promise<BeResult<StaticQr>> {
  if (isFixtureMode()) {
    const qr = fixtureRotateStaticQr(id);
    return Promise.resolve(qr ? ok(qr) : notFound("Không tìm thấy mã QR tĩnh đang dùng"));
  }
  return merchantClient().post({ path: staticQrPaths.rotate(id), schema: staticQrSchema });
}
