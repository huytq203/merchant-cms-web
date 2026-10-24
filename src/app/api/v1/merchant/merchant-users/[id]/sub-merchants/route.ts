import { assignUserSubMerchants } from "@/server/modules/users/user.service";
import { handleScopeAssignment } from "@/server/modules/users/scope-assignment";

type Context = { params: Promise<{ id: string }> };

/** Replaces the user's sub-merchants; the only axis a Sub-level manager may change. */
export function PUT(request: Request, context: Context) {
  return handleScopeAssignment(request, context, { assign: assignUserSubMerchants });
}
