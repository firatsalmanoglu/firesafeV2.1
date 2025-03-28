import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { NotificationStatus } from "@prisma/client";

// GET - Tek bir bildirimi getir
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await prisma.notifications.findUnique({
      where: {
        id: params.id,
      },
      include: {
        device: true,
        deviceType: true,
        creator: {
          select: {
            name:true,
            institutionId: true,
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
        type: true,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Bildirim bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('[NOTIFICATION_GET_BY_ID]', error);
    return NextResponse.json(
      { 
        error: 'Bildirim getirilemedi',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

// PUT - Bildirimi güncelle
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    // Zorunlu alanların kontrolü
    const requiredFields = [
      'content',
      'deviceId',
      'deviceTypeId',
      'creatorId',
      'creatorInsId',
      'recipientId',
      'recipientInsId',
      'typeId'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} alanı zorunludur` },
          { status: 400 }
        );
      }
    }

    const updatedNotification = await prisma.notifications.update({
      where: {
        id: params.id,
      },
      data: {
        content: data.content,
        deviceId: data.deviceId,
        deviceTypeId: data.deviceTypeId,
        creatorId: data.creatorId,
        creatorInsId: data.creatorInsId,
        recipientId: data.recipientId,
        recipientInsId: data.recipientInsId,
        typeId: data.typeId,
        isRead: data.isRead as NotificationStatus || "Okunmadi",
      },
      include: {
        device: true,
        deviceType: true,
        creator: {
          select: {
            name:true,
          }
        },
        recipient: {
          select: {
            name:true,
          }
        },
        type: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedNotification
    });
  } catch (error) {
    console.error('[NOTIFICATION_UPDATE_BY_ID]', error);
    return NextResponse.json(
      { 
        error: 'Bildirim güncellenemedi',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

// DELETE - Bildirimi sil
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deletedNotification = await prisma.notifications.delete({
      where: {
        id: params.id,
      },
      include: {
        device: true,
        deviceType: true,
        creator: {
          select: {
            name:true,
          }
        },
        recipient: {
          select: {
            name:true,
          }
        },
        type: true
      }
    });

    return NextResponse.json({
      success: true,
      data: deletedNotification
    });
  } catch (error) {
    console.error('[NOTIFICATION_DELETE_BY_ID]', error);
    return NextResponse.json(
      { 
        error: 'Bildirim silinemedi',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}