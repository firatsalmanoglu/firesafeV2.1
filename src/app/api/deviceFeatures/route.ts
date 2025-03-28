// app/api/deviceFeatures/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Bu satırı ekledik


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const typeId = searchParams.get('typeId');

        const features = await prisma.$queryRaw`
            SELECT * FROM "DeviceFeatures"
            WHERE "deviceTypeId" = ${typeId}
            ORDER BY name ASC
        `;

        return NextResponse.json(features);
    } catch (error) {
        console.log("[DEVICE_FEATURES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}