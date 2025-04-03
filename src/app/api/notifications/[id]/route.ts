import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
    const headersList = headers();
    const userId = data.userId;  // İşlemi yapan kullanıcının ID'si

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

    // Log kaydı oluştur
    let logUserId = userId || data.creatorId;
    
    // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
    if (!logUserId) {
      console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      
      if (adminUser) {
        console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
        await createLogEntry(adminUser.id, "GÜNCELLE", "Notifications", headersList);
      } else {
        console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          console.log(`Kullanıcı bulundu: ${anyUser.id}`);
          await createLogEntry(anyUser.id, "GÜNCELLE", "Notifications", headersList);
        } else {
          console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
        }
      }
    } else {
      // Kullanıcı ID'si var, doğrudan kullan
      await createLogEntry(logUserId, "GÜNCELLE", "Notifications", headersList);
    }

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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');  // İşlemi yapan kullanıcının ID'si
    const headersList = headers();
    
    // Silmeden önce bildirimi bul (log için creator bilgisi gerekebilir)
    const notification = await prisma.notifications.findUnique({
      where: {
        id: params.id,
      }
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Bildirim bulunamadı' },
        { status: 404 }
      );
    }

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

    // Log kaydı oluştur
    let logUserId = userId || notification.creatorId;
    
    // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
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