import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Bu satırı ekledik


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceTypeId = searchParams.get('deviceTypeId');

        if (!deviceTypeId) {
            return new NextResponse(JSON.stringify({
                error: "Device Type ID gerekli"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const operations = await prisma.operations.findMany({
            where: {
                deviceTypeId: deviceTypeId
            },
            select: {
                id: true,
                name: true
            }
        });

        return NextResponse.json(operations);
    } catch (error) {
        console.error("[OPERATIONS_GET]", error);
        return new NextResponse(JSON.stringify({
            error: "İşlemler getirilirken bir hata oluştu"
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}