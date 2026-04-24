import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/mock/mock-store";

type Params = { params: Promise<{ id: string }> };
type SubMerchant = Record<string, unknown>;
type MockData = { subMerchants: SubMerchant[] };

const store = mockStore<MockData>("data-submechant.json");
const delay = () => new Promise((r) => setTimeout(r, 300));

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await delay();

  const mock = await store.read();
  const item = mock.subMerchants.find((m) => m.id === id) ?? null;
  if (!item) {
    return NextResponse.json({ error: "Không tìm thấy sub-merchant" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (!body.name || !body.businessType) {
    return NextResponse.json(
      { error: "name, businessType là bắt buộc" },
      { status: 422 },
    );
  }

  await delay();
  const mock = await store.read();
  const index = mock.subMerchants.findIndex((m) => m.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Không tìm thấy sub-merchant" }, { status: 404 });
  }

  const existing = mock.subMerchants[index];
  const updated: SubMerchant = {
    id,
    name: body.name,
    businessType: body.businessType,
    contact: body.contact ?? body.notifyEmails ?? existing?.contact ?? "",
    status: body.status ?? existing?.status ?? "active",
    createdAt: existing?.createdAt,
    taxCode: body.taxCode ?? "",
    representative: body.representative ?? "",
    address: body.address ?? "",
    merchantId: body.merchantId ?? existing?.merchantId,
    accessKey: body.accessKey ?? existing?.accessKey,
    secretKey: body.secretKey ?? existing?.secretKey,
    webhookUrl: body.webhookUrl ?? "",
    bankName: body.bankName ?? "",
    bankBranch: body.bankBranch ?? "",
    accountNumber: body.accountNumber ?? "",
    accountName: body.accountName ?? "",
    notifyEnabled: body.notifyEnabled ?? false,
    notifyTxSuccess: body.notifyTxSuccess ?? true,
    notifyTxFailed: body.notifyTxFailed ?? false,
    notifyDispute: body.notifyDispute ?? true,
    notifyFreeze: body.notifyFreeze ?? true,
    notifyPolicyChange: body.notifyPolicyChange ?? false,
    notifyEmails: body.notifyEmails ?? "",
    eInvoiceEnabled: body.eInvoiceEnabled ?? false,
    eInvoiceEmails: body.eInvoiceEmails ?? "",
  };

  await store.update((m) => {
    const list = [...m.subMerchants];
    list[index] = updated;
    return { ...m, subMerchants: list };
  });

  return NextResponse.json(updated);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  await delay();
  const mock = await store.read();
  const index = mock.subMerchants.findIndex((m) => m.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Không tìm thấy sub-merchant" }, { status: 404 });
  }

  const updated = { ...mock.subMerchants[index], ...body, id };
  await store.update((m) => {
    const list = [...m.subMerchants];
    list[index] = updated;
    return { ...m, subMerchants: list };
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  await delay();
  const mock = await store.read();
  const index = mock.subMerchants.findIndex((m) => m.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Không tìm thấy sub-merchant" }, { status: 404 });
  }

  await store.update((m) => ({
    ...m,
    subMerchants: m.subMerchants.filter((item) => item.id !== id),
  }));

  return new NextResponse(null, { status: 204 });
}
