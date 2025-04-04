// /api/devices/count-by-institution/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const institutionId = params.id;

    // Belirli kuruma ait cihaz sayısını getir
    const count = await prisma.devices.count({
      where: {
        ownerInstId: institutionId,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Kurum cihaz sayısı alma hatası:", error);
    return NextResponse.json(
      { error: "Kurum cihaz sayısı alınamadı" },
      { status: 500 }
    );
  }
}