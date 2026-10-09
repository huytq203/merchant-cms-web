import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { terminalFormSchema } from "@/features/terminals/schemas";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { updateTerminal } from "@/server/modules/terminals/terminal.service";
import { requireOwnedTerminal, requireTerminalAccess } from "@/server/modules/terminals/require-terminal-access";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireTerminalAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedTerminal(id, access.user);
  return detail instanceof NextResponse ? detail : NextResponse.json(detail);
}

export async function PUT(request: Request, context: Context) {
  const access = await requireTerminalAccess();
  if (!access.ok) return access.response;
  const body = terminalFormSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedTerminal(id, access.user);
  if (detail instanceof NextResponse) return detail;
  if (body.data.subMerchantId !== detail.subMerchantId) {
    return NextResponse.json({ message: "Không thể đổi Sub-merchant cha" }, { status: 400 });
  }
  const result = await updateTerminal(id, body.data);
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
