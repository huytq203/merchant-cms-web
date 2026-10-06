import { NextResponse } from "next/server";
import { z } from "zod";

const uuidSchema = z.uuid();

/**
 * Route handlers forward `[id]` into BE paths, so anything that is not a UUID is answered with
 * 404 before it can reach the BE (path traversal like `..%2f` included).
 */
export function invalidIdResponse(id: string): NextResponse | null {
  return uuidSchema.safeParse(id).success
    ? null
    : NextResponse.json({ message: "Không tìm thấy dữ liệu" }, { status: 404 });
}
