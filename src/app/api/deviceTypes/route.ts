// app/api/deviceTypes/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const types = await prisma.deviceTypes.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(types);
    } catch (error) {
        console.log("[DEVICE_TYPES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}