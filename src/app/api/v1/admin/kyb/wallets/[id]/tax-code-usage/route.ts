import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { getTaxCodeUsage } from "@/server/modules/kyb/kyb.service";
import {
  requireKybAccess,
  requireOwnedWallet,
  toRouteResponse,
} from "@/server/modules/kyb/require-kyb-access";

type Context = { params: Promise<{ id: string }> };

const TAX_CODE = /^[0-9-]{10,13}$/;

/** The warning under the tax-code field: which other wallets already hold this code. */
export async function GET(request: Request, context: Context) {
  const access = await requireKybAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const taxCode = new URL(request.url).searchParams.get("taxCode") ?? "";
  if (!TAX_CODE.test(taxCode)) return NextResponse.json({ message: "Mã số thuế không hợp lệ" }, { status: 400 });
  const notOwned = await requireOwnedWallet(id, access.user);
  if (notOwned) return notOwned;
  return toRouteResponse(await getTaxCodeUsage(id, taxCode));
}
