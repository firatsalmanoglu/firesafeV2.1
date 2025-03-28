// app/api/users/list/route.ts (mevcut users API'den ayrı tutmak için)
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name:true,
                email: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.log("[USERS_LIST_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}