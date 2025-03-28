//DeviceForm.tsx'te Cihaz Sahibi ID girilince o kişinin adı soyadı ve kurum adını getiriyor.


import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        institution: true, // Kurum bilgisini de getir
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Kullanıcı bilgisi alınamadı" },
      { status: 500 }
    );
  }
}