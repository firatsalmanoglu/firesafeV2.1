// app/api/appointments/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Tüm randevuları getir


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const institutionId = searchParams.get("institutionId");

    let whereClause = {};
    
    if (userId) {
      whereClause = {
        OR: [
          { creatorId: userId },
          { recipientId: userId }
        ]
      };
    }
    
    if (institutionId) {
      whereClause = {
        OR: [
          { creatorInsId: institutionId },
          { recipientInsId: institutionId }
        ]
      };
    }

    const appointments = await prisma.appointments.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            name: true,
          },
        },
        creatorIns: {
          select: {
            name: true,
          },
        },
        recipient: {
          select: {
            name: true,
          },
        },
        recipientIns: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        start: 'asc', // Randevuları başlangıç tarihine göre sıralıyoruz
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Randevular getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Randevular getirilemedi' },
      { status: 500 }
    );
  }
}

// POST - Yeni randevu oluştur
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const newAppointment = await prisma.appointments.create({
      data: {
        tittle: body.title,
        content: body.content,
        start: new Date(body.start),
        end: new Date(body.end),
        creatorId: body.creatorId,
        creatorInsId: body.creatorInsId,
        recipientId: body.recipientId,
        recipientInsId: body.recipientInsId,
      },
    });

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Randevu oluşturulurken hata:', error);
    return NextResponse.json(
      { error: 'Randevu oluşturulamadı' },
      { status: 500 }
    );
  }
}