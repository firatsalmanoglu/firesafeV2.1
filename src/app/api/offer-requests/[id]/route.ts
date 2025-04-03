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
    const offerRequest = await prisma.offerRequests.findUnique({
      where: {
        id: params.id,
      },
      include: {
        creator: true,
        creatorIns: true,
        RequestSub: {
          include: {
            service: true
          }
        }
      }
    });

    if (!offerRequest) {
      return new NextResponse('Teklif talebi bulunamadı', { status: 404 });
    }

    return NextResponse.json(offerRequest);
  } catch (error) {
    console.error('Teklif talebi getirme hatası:', error);
    return new NextResponse('Teklif talebi alınırken bir hata oluştu', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const headersList = headers();
    const userId = body.userId || body.creatorId; // İşlemi yapan kullanıcının ID'si

    // Transaction ile güncelleme işlemi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mevcut alt kalemleri sil
      await tx.requestSub.deleteMany({
        where: {
          offerRequestId: params.id
        }
      });

      // 2. Ana teklif talebini güncelle
      const offerRequest = await tx.offerRequests.update({
        where: {
          id: params.id
        },
        data: {
          start: new Date(body.start),
          end: new Date(body.end),
          status: body.status,
          details: body.details,
          creatorId: body.creatorId,
          creatorInsId: body.creatorInsId,
        }
      });

      // 3. Yeni alt kalemleri oluştur
      const requestSubPromises = body.requestSub.map((sub: any) =>
        tx.requestSub.create({
          data: {
            requiredDate: new Date(sub.requiredDate),
            serviceId: sub.serviceId,
            quantity: sub.quantity,
            detail: sub.detail,
            offerRequestId: params.id,
          }
        })
      );

      await Promise.all(requestSubPromises);

      return offerRequest;
    });

    // Log kaydı oluştur
    let logUserId = userId;
    
    // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
    if (!logUserId) {
      console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      
      if (adminUser) {
        console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
        await createLogEntry(adminUser.id, "GÜNCELLE", "OfferRequests", headersList);
      } else {
        console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          console.log(`Kullanıcı bulundu: ${anyUser.id}`);
          await createLogEntry(anyUser.id, "GÜNCELLE", "OfferRequests", headersList);
        } else {
          console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
        }
      }
    } else {
      // Kullanıcı ID'si var, doğrudan kullan
      await createLogEntry(logUserId, "GÜNCELLE", "OfferRequests", headersList);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Teklif talebi güncelleme hatası:', error);
    return new NextResponse('Teklif talebi güncellenirken bir hata oluştu', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // İşlemi yapan kullanıcının ID'si
    const headersList = headers();

    // Önce kaydın var olup olmadığını kontrol edelim
    const existingRequest = await prisma.offerRequests.findUnique({
      where: {
        id: params.id
      },
      include: {
        RequestSub: true
      }
    });

    if (!existingRequest) {
      return new NextResponse('Teklif talebi bulunamadı', { status: 404 });
    }

    // Transaction ile silme işlemi
    await prisma.$transaction(async (tx) => {
      // 1. Alt kalemleri sil
      await tx.requestSub.deleteMany({
        where: {
          offerRequestId: params.id
        }
      });

      // 2. Ana teklif talebini sil
      await tx.offerRequests.delete({
        where: {
          id: params.id
        }
      });
    });

    // Log kaydı oluştur
    let logUserId = userId || existingRequest.creatorId;
    
    // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
    if (!logUserId) {
      console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      
      if (adminUser) {
        console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
        await createLogEntry(adminUser.id, "SİL", "OfferRequests", headersList);
      } else {
        console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          console.log(`Kullanıcı bulundu: ${anyUser.id}`);
          await createLogEntry(anyUser.id, "SİL", "OfferRequests", headersList);
        } else {
          console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
        }
      }
    } else {
      // Kullanıcı ID'si var, doğrudan kullan
      await createLogEntry(logUserId, "SİL", "OfferRequests", headersList);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Teklif talebi silme hatası:', error);
    // Hata detayını görelim
    return new NextResponse(`Teklif talebi silinirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, { status: 500 });
  }
}