// app/api/appointments/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Tek bir randevu getir
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.appointments.findUnique({
      where: {
        id: params.id,
      },
      include: {
        creator: {
          select: {
            name:true,
          },
        },
        creatorIns: {
          select: {
            name: true,
          },
        },
        recipient: {
          select: {
            name:true,
          },
        },
        recipientIns: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Randevu getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Randevu getirilemedi' },
      { status: 500 }
    );
  }
}

// PUT - Randevu güncelle
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const updatedAppointment = await prisma.appointments.update({
      where: {
        id: params.id,
      },
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

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Randevu güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Randevu güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Randevu sil
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.appointments.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(
      { message: 'Randevu başarıyla silindi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Randevu silinirken hata:', error);
    return NextResponse.json(
      { error: 'Randevu silinemedi' },
      { status: 500 }
    );
  }
}