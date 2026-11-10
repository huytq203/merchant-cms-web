import { NextResponse } from "next/server";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { z } from "zod";
import { terminalFormSchema, terminalTypeSchema } from "@/features/terminals/schemas";
import { subMerchantStatusSchema } from "@/lib/be/node-schemas";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { createTerminal, listTerminals } from "@/server/modules/terminals/terminal.service";
import { requireTerminalAccess, selectSubMerchantId } from "@/server/modules/terminals/require-terminal-access";

const listQuerySchema = paginationQuerySchema.extend({
  subMerchantId: z.uuid().optional(),
  name: z.string().max(100).optional(),
  status: subMerchantStatusSchema.optional(),
  terminalType: terminalTypeSchema.optional(),
});

export async function GET(request: Request) {
  const access = await requireTerminalAccess("read");
  if (!access.ok) return access.response;
  const query = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const subMerchantId = selectSubMerchantId(access.user, query.data.subMerchantId);
  if (subMerchantId instanceof NextResponse) return subMerchantId;
  const result = await listTerminals({ ...query.data, subMerchantId });
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}

export async function POST(request: Request) {
  const access = await requireTerminalAccess("write");
  if (!access.ok) return access.response;
  const body = terminalFormSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const subMerchantId = selectSubMerchantId(access.user, body.data.subMerchantId);
  if (subMerchantId instanceof NextResponse) return subMerchantId;
  if (!subMerchantId) {
    return NextResponse.json({ message: "Vui lòng chọn Sub-merchant" }, { status: 400 });
  }
  const result = await createTerminal({ ...body.data, subMerchantId });
  return result.success
    ? NextResponse.json(result.data, { status: 201 })
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
