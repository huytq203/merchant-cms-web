import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { reasonBodySchema } from "@/lib/schemas/reason";
import { canLockTerminal } from "@/features/terminals/utils/terminal-mapper";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { lockTerminal } from "@/server/modules/terminals/terminal.service";
import { requireOwnedTerminal, requireTerminalAccess } from "@/server/modules/terminals/require-terminal-access";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireTerminalAccess();
  if (!access.ok) return access.response;
  const body = reasonBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedTerminal(id, access.user);
  if (detail instanceof NextResponse) return detail;
  if (!canLockTerminal(detail)) return NextResponse.json({ message: "Không thể khóa Terminal này" }, { status: 409 });
  const result = await lockTerminal(id, body.data.reason);
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
