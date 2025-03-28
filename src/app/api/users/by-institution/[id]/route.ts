//DeviceForm.tsx'te Kurum seçilince o kuruma bağlı personelleri getiriyor.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const institutionId = params.id;
    
    const users = await prisma.user.findMany({
      where: {
        institutionId: institutionId,
      },
      select: {
        id: true,
        name:true,
        email: true,
        institutionId: true,
      },
    });

    if (!users.length) {
      return NextResponse.json(
        { error: "Bu kuruma ait kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Kurum kullanıcıları alınamadı" },
      { status: 500 }
    );
  }
}