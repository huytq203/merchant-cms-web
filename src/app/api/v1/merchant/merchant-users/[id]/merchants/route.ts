import { NextResponse } from "next/server";
import { assignUserMerchants } from "@/server/modules/users/user.service";
import { handleScopeAssignment } from "@/server/modules/users/scope-assignment";

type Context = { params: Promise<{ id: string }> };

/**
 * Replaces the user's whole-merchant scope. The BE answers 404 for every non-empty list from a Sub-level manager
 * (they own no merchant) and for a merchant they do not own, so both are refused here with a message that says why.
 */
export function PUT(request: Request, context: Context) {
  return handleScopeAssignment(request, context, {
    assign: assignUserMerchants,
    guard: (user, ids) =>
      ids.every((id) => user.merchantIds.includes(id))
        ? null
        : NextResponse.json({ message: "Chỉ người sở hữu merchant mới gán được phạm vi merchant. Hãy gán theo sub-merchant." }, { status: 403 }),
  });
}
