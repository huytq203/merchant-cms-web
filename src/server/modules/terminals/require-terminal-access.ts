import "server-only";

import { NextResponse } from "next/server";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import type { SessionUser } from "@/types/auth";
import type { TerminalDetail } from "@/features/terminals/types";
import { getTerminal } from "./terminal.service";

export function requireTerminalAccess(): Promise<PermissionAccess> {
  return requirePermission("MANAGE_SUB_MERCHANT");
}

export function selectSubMerchantId(
  user: SessionUser,
  requested: string | null | undefined,
): string | undefined | NextResponse {
  if (requested && !user.subMerchantIds.includes(requested)) {
    return NextResponse.json(
      { message: "Không có quyền truy cập" },
      { status: 403 },
    );
  }
  return requested ?? undefined;
}

export async function requireOwnedTerminal(
  id: string,
  user: SessionUser,
): Promise<TerminalDetail | NextResponse> {
  const result = await getTerminal(id);
  if (!result.success) {
    return NextResponse.json(
      { message: domainErrorMessage(result.error) },
      { status: toDomainHttpStatus(result.error) },
    );
  }
  if (!user.subMerchantIds.includes(result.data.subMerchantId)) {
    return NextResponse.json(
      { message: "Không tìm thấy Terminal" },
      { status: 404 },
    );
  }
  return result.data;
}
