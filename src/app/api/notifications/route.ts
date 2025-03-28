// app/api/notifications/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NotificationStatus } from "@prisma/client";

export async function POST(req: Request) {
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
                return new NextResponse(
                    JSON.stringify({
                        error: `${field} alanı zorunludur`
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
        }

        // Bildirim oluştur
        const notification = await prisma.notifications.create({
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
                notificationDate: new Date(),
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
            data: notification
        });

    } catch (error) {
        console.error("[NOTIFICATIONS_POST]", error);
        
        return new NextResponse(
            JSON.stringify({
                error: "Bildirim oluşturulurken bir hata oluştu",
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const recipientId = searchParams.get('recipientId');
        const typeId = searchParams.get('typeId');
        const isRead = searchParams.get('isRead') as NotificationStatus;

        // Filtreleme koşulları
        let where = {};
        if (recipientId) where = { ...where, recipientId };
        if (typeId) where = { ...where, typeId };
        if (isRead) where = { ...where, isRead };

        const notifications = await prisma.notifications.findMany({
            where,
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
            },
            orderBy: {
                notificationDate: 'desc'
            }
        });

        return NextResponse.json(notifications);

    } catch (error) {
        console.error("[NOTIFICATIONS_GET]", error);
        
        return new NextResponse(
            JSON.stringify({
                error: "Bildirimler getirilirken bir hata oluştu",
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new NextResponse(
                JSON.stringify({
                    error: 'Bildirim ID\'si gerekli'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const deletedNotification = await prisma.notifications.delete({
            where: {
                id: id
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
        console.error("[NOTIFICATIONS_DELETE]", error);
        
        return new NextResponse(
            JSON.stringify({
                error: "Bildirim silinirken bir hata oluştu",
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}