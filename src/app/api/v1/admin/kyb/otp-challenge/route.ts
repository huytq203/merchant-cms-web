import { requestKybOtp } from "@/server/modules/kyb/kyb.service";
import { requireKybOtpAccess, toRouteResponse } from "@/server/modules/kyb/require-kyb-access";

/** The operation is fixed in the service: a browser cannot ask for any other kind of code through here. */
export async function POST() {
  const access = await requireKybOtpAccess();
  if (!access.ok) return access.response;
  return toRouteResponse(await requestKybOtp());
}
