import { z } from "zod";

/** Loose RestApiResponse envelope; each caller validates data separately. */
export const envelopeSchema = z.object({
  success: z.boolean(),
  status: z.string().nullish(),
  message: z.string().nullish(),
  detail: z.string().nullish(),
  /** The BE omits `data` when it is null (`@JsonInclude(NON_NULL)`), so the key must be optional. */
  data: z.unknown().optional(),
});

/** For endpoints that return no payload. */
export const emptySchema = z.union([z.undefined(), z.null()]).transform(() => undefined);

/** Spring Page<T> with a zero-based number field. */
export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    content: z.array(item),
    totalElements: z.number(),
    totalPages: z.number(),
    number: z.number(),
    size: z.number(),
  });

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};
