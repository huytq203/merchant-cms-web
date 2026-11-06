import { listAssignableGroups } from "@/server/modules/users/user.service";
import { requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

/** Group choices for the create and assign-groups forms; MANAGE_USER is enough, the BE filters by what the caller may give. */
export async function GET() {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  return serviceResponse(await listAssignableGroups());
}
