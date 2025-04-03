import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const maintenance = await prisma.maintenanceCards.findUnique({
      where: {
        id: params.id
      },
      include: {
        device: {
          include: {
            type: true,
            feature: true,
            owner: true,
            ownerIns: true,
            provider: true,
            providerIns: true,
          }
        },
        MaintenanceSub: {
          include: {
            opreation: true
          }
        }
      }
    });

    if (!maintenance) {
      return new NextResponse('Bakım kartı bulunamadı', { status: 404 });
    }

    return NextResponse.json(maintenance);
  } catch (error) {
    console.error('Bakım kartı getirme hatası:', error);
    return new NextResponse('Bakım kartı alınırken bir hata oluştu', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const headersList = headers();
    const userId = body.userId; // İşlemi yapan kullanıcının ID'si
    
    // Transaction ile güncelleme işlemi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mevcut alt işlemleri sil
      await tx.maintenanceSub.deleteMany({
        where: {
          maintenanceCardId: params.id
        }
      });

      // 2. Ana kaydı güncelle
      const maintenanceCard = await tx.maintenanceCards.update({
        where: {
          id: params.id
        },
        data: {
          deviceId: body.deviceId,
          deviceTypeId: body.deviceTypeId,
          deviceFeatureId: body.deviceFeatureId,
          providerId: body.providerId,
          providerInsId: body.providerInsId,
          customerId: body.customerId,
          customerInsId: body.customerInsId,
          maintenanceDate: new Date(body.maintenanceDate),
          nextMaintenanceDate: new Date(body.nextMaintenanceDate),
          details: body.details || null,
          MaintenanceSub: {
            create: body.operations.map((operationId: string) => ({
              operationId,
              detail: null
            }))
          }
        },
        include: {
          device: true,
          deviceType: true,
          deviceFeature: true,
          provider: true,
          providerIns: true,
          customer: true,
          customerIns: true,
          MaintenanceSub: {
            include: {
              opreation: true
            }
          }
        }
      });

      return maintenanceCard;
    });

    // Log kaydı oluştur
    // Öncelikle providerId kullanılır, çünkü bakımı yapan kişidir
    let logUserId = userId;
    
    // userId yoksa, bakım kartının sağlayıcı ID'sini kullan
    if (!logUserId) {
      if (result.providerId) {
        logUserId = result.providerId;
      } else {
        // Yoksa admin kullanıcı veya herhangi bir kullanıcı bul
        console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
        const adminUser = await prisma.user.findFirst({
          where: { role: "ADMIN" }
        });
        
        if (adminUser) {
          console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
          logUserId = adminUser.id;
        } else {
          console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
          const anyUser = await prisma.user.findFirst();
          if (anyUser) {
            console.log(`Kullanıcı bulundu: ${anyUser.id}`);
            logUserId = anyUser.id;
          } else {
            console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
            return NextResponse.json(result);
          }
        }
      }
    }
    
    // Log kaydı oluştur
    await createLogEntry(logUserId, "GÜNCELLE", "MaintenanceCards", headersList);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bakım kartı güncelleme hatası:', error);
    return new NextResponse('Bakım kartı güncellenirken bir hata oluştu', { status: 500 });
  }
}

// DELETE işlemini de ekleyelim
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const headersList = headers();

    // Önce silmeden önce bakım kartını bulalım, log için provider bilgisine ihtiyacımız olabilir
    const maintenanceCard = await prisma.maintenanceCards.findUnique({
      where: {
        id: params.id
      }
    });

    if (!maintenanceCard) {
      return new NextResponse('Bakım kartı bulunamadı', { status: 404 });
    }

    // Transaction ile silme işlemi
    await prisma.$transaction(async (tx) => {
      // 1. Önce alt işlemleri sil
      await tx.maintenanceSub.deleteMany({
        where: {
          maintenanceCardId: params.id
        }
      });

      // 2. Ana kaydı sil
      await tx.maintenanceCards.delete({
        where: {
          id: params.id
        }
      });
    });

    // Log kaydı oluştur
    let logUserId = userId;
    
    // userId yoksa, bakım kartının sağlayıcı ID'sini kullan
    if (!logUserId) {
      if (maintenanceCard.providerId) {
        logUserId = maintenanceCard.providerId;
      } else {
        // Yoksa admin kullanıcı veya herhangi bir kullanıcı bul
        console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
        const adminUser = await prisma.user.findFirst({
          where: { role: "ADMIN" }
        });
        
        if (adminUser) {
          console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
          logUserId = adminUser.id;
        } else {
          console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
          const anyUser = await prisma.user.findFirst();
          if (anyUser) {
            console.log(`Kullanıcı bulundu: ${anyUser.id}`);
            logUserId = anyUser.id;
          } else {
            console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
            return new NextResponse('Bakım kartı başarıyla silindi', { status: 200 });
          }
        }
      }
    }
    
    // Log kaydı oluştur
    await createLogEntry(logUserId, "SİL", "MaintenanceCards", headersList);

    return new NextResponse('Bakım kartı başarıyla silindi', { status: 200 });
  } catch (error) {
    console.error('Bakım kartı silme hatası:', error);
    return new NextResponse('Bakım kartı silinirken bir hata oluştu', { status: 500 });
  }
}