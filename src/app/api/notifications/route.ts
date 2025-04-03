// app/api/notifications/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NotificationStatus } from "@prisma/client";
import { headers } from "next/headers";

// Log kaydı oluşturmak için yardımcı fonksiyon
async function createLogEntry(userId: string, actionType: string, tableName: string, requestHeaders: Headers) {
    try {
        console.log(`Log oluşturuluyor: UserId=${userId}, Action=${actionType}, Table=${tableName}`);
        
        // Kullanıcının var olup olmadığını kontrol et
        const userExists = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!userExists) {
            console.error(`User ID bulunamadı: ${userId}`);
            return false;
        }
        
        // Action tablosunda ilgili kayıt var mı, yoksa oluştur
        let action = await prisma.actions.findFirst({
            where: { name: actionType }
        });
        
        if (!action) {
            console.log(`Yeni Actions kaydı oluşturuluyor: ${actionType}`);
            action = await prisma.actions.create({
                data: { name: actionType }
            });
        }
        
        // Table tablosunda ilgili kayıt var mı, yoksa oluştur
        let table = await prisma.tables.findFirst({
            where: { name: tableName }
        });
        
        if (!table) {
            console.log(`Yeni Tables kaydı oluşturuluyor: ${tableName}`);
            table = await prisma.tables.create({
                data: { name: tableName }
            });
        }
        
        // IP adresini al
        const ip = requestHeaders.get('x-forwarded-for') || 
                  requestHeaders.get('x-real-ip') || 
                  '127.0.0.1';
        
        console.log(`Log verileri: ActionId=${action.id}, TableId=${table.id}, IP=${ip}`);
        
        // Log kaydını oluştur
        const log = await prisma.logs.create({
            data: {
                userId: userId,
                actionId: action.id,
                tableId: table.id,
                IP: ip
            }
        });
        
        console.log(`Log kaydı oluşturuldu: ${log.id}`);
        return true;
    } catch (error) {
        console.error("[LOG_CREATION_ERROR]", error);
        return false;
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const headersList = headers();
        const userId = data.userId || data.creatorId; // İşlemi yapan kullanıcının ID'si

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

        // Log kaydı oluştur - Eğer userId yoksa creatorId kullanıyoruz
        let logUserId = userId;
        
        // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
        if (!logUserId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "EKLE", "Notifications", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "EKLE", "Notifications", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(logUserId, "EKLE", "Notifications", headersList);
        }

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
        const userId = searchParams.get('userId'); // İşlemi yapan kullanıcının ID'si
        const headersList = headers();

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

        // Silinecek bildirimi önce bulalım (creatorId için)
        const notification = await prisma.notifications.findUnique({
            where: { id }
        });

        if (!notification) {
            return new NextResponse(
                JSON.stringify({
                    error: 'Bildirim bulunamadı'
                }),
                {
                    status: 404,
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

        // Log kaydı oluştur
        // Öncelikle userId, yoksa creatorId'yi kullan
        let logUserId = userId || notification.creatorId;
        
        // Eğer bu değerler yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
        if (!logUserId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "SİL", "Notifications", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "SİL", "Notifications", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(logUserId, "SİL", "Notifications", headersList);
        }

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