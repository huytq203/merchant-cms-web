import "server-only";

import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import type { BeResult } from "@/lib/be/client";
import { scopeAssignmentBodySchema, type ScopeAssignmentResult } from "@/features/users/schemas/user.schema";
import type { SessionUser } from "@/types/auth";
import { requireUserAccess, serviceResponse } from "./require-user-access";

type Context = { params: Promise<{ id: string }> };

interface Options {
  assign: (id: string, ids: string[]) => Promise<BeResult<ScopeAssignmentResult>>;
  /** Extra check on the target ids before the BE is called; return a response to refuse. */
  guard?: (user: SessionUser, ids: string[]) => NextResponse | null;
}

/**
 * Shared PUT handler of the two scope axes. The BE does not apply the change: widening becomes a proposal that
 * another person approves (202 PENDING_APPROVAL); only a narrowing is applied at once (200 APPROVED, id null).
 * The BE checks the target user and ids against the caller's scope and answers 404 outside it, so no
 * user lookup is done here (it would wrongly hide users from a Sub-level manager).
 */
export async function handleScopeAssignment(request: Request, context: Context, options: Options): Promise<NextResponse> {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const body = scopeAssignmentBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  if (id === access.user.userId) return NextResponse.json({ message: "Bạn không thể sửa chính mình" }, { status: 403 });
  const refused = options.guard?.(access.user, body.data.ids);
  if (refused) return refused;
  const result = await options.assign(id, body.data.ids);
  return serviceResponse(result, result.success && result.data.status !== "APPROVED" ? 202 : 200);
}
