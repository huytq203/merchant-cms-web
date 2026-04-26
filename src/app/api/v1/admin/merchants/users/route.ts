import { NextRequest, NextResponse } from "next/server";
import dataUser from "@/mock/data-user.json";

const delay=()=>new Promise((resolve)=>setTimeout(resolve,300));
export async function GET(_request: NextRequest) {
    const {searchParams} = _request.nextUrl;
    const keyword = searchParams.get("name") || searchParams.get("email");
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 10;

    await delay();

    let results = dataUser.users;
    if(keyword){
        const kw=keyword.toLowerCase();
        results = dataUser.users.filter((user) => user.name.toLowerCase().includes(kw) || user.email.toLowerCase().includes(kw));
       
    }
    const total = results.length;
    const start = (page - 1) * pageSize;
    const paged = results.slice(start, start + pageSize);

    return NextResponse.json({ data: paged, pagination: { page, pageSize, total } });
}