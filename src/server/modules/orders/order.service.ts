import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { orderResponseSchema, type Order, type OrderFormData } from "@/features/orders/schemas/order.schema";
import type { OrderListFilter, OrderListResult } from "@/features/orders/types/types";
import { toOrderCreateRequest } from "@/features/orders/utils/order-mapper";
import { orderPaths } from "./order.paths";

export async function listOrders(filter: OrderListFilter): Promise<BeResult<OrderListResult>> {
  const result = await merchantClient().get({
    path: orderPaths.list,
    schema: pageSchema(orderResponseSchema),
    query: {
      page: filter.page,
      size: filter.pageSize,
      orderCode: filter.orderCode,
      status: filter.status,
      subMerchantId: filter.subMerchantId,
      createdFrom: filter.createdFrom,
      createdTo: filter.createdTo,
    },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export const getOrder = (id: string): Promise<BeResult<Order>> =>
  merchantClient().get({ path: orderPaths.detail(id), schema: orderResponseSchema });

export const createOrder = (values: OrderFormData, merchantId: string): Promise<BeResult<Order>> =>
  merchantClient().post({
    path: orderPaths.create,
    schema: orderResponseSchema,
    body: toOrderCreateRequest(values, merchantId),
  });

export const refreshOrderQr = (id: string): Promise<BeResult<Order>> =>
  merchantClient().post({ path: orderPaths.refreshQr(id), schema: orderResponseSchema });
