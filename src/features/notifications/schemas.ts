import { z } from "zod";

/**
 * BE times are ISO-8601 UTC with a `Z` suffix (contract 2026-10-23); an offset is accepted too so a
 * BE serializer change does not empty the inbox. Display converts to Vietnam time.
 */
const utcInstantSchema = z.iso.datetime({ offset: true });

/**
 * One inbox row. `title`/`body` are already Vietnamese and shown verbatim. `type` stays a plain
 * string: a new BE type must still render instead of failing the whole list.
 */
export const notificationSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  orderId: z.uuid().nullable(),
  subMerchantId: z.uuid().nullable(),
  createdAt: utcInstantSchema,
  readAt: utcInstantSchema.nullable(),
});

export const unreadCountSchema = z.object({ count: z.number().int().min(0) });

export const markAllReadResultSchema = z.object({ updated: z.number().int().min(0) });

/** Page size cap mirrors the BE, which silently trims anything above 100. */
export const notificationFilterSchema = z.object({
  unreadOnly: z.boolean().default(false),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
