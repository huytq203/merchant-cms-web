import { NextRequest, NextResponse } from "next/server";
import dataTrasaction from '@/mock/data-transaction.json';
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "";

  await new Promise((resolve) => setTimeout(resolve, 1000));
  let results = [...dataTrasaction.transactions];

   if (keyword) {
    const kw = keyword.toLowerCase();
    results = results.filter(
      (item) =>
        item.code.toLowerCase().includes(kw) ||
        item.customerName.toLowerCase().includes(kw),
    );
  }
   if (status) {
    results = results.filter((item) => item.status === status);
  }
  const total = results.length;
  const start = (page - 1) * pageSize;
  const paged = results.slice(start, start + pageSize);

  return NextResponse.json({data: paged,pagination: { page, pageSize, total },});
}
