// app/api/notification-types/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const notificationTypes = await prisma.notificationTypes.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(notificationTypes);
        
    } catch (error) {
        console.error("[NOTIFICATION_TYPES_GET]", error);
        
        return new NextResponse(
            JSON.stringify({
                error: "Bildirim türleri getirilirken bir hata oluştu",
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}