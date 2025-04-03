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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headersList = headers();
    const userId = body.userId || body.creatorId; // İşlemi yapan kullanıcının ID'si

    // Transaction ile kayıt işlemi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ana teklif talebini oluştur
      const offerRequest = await tx.offerRequests.create({
        data: {
          start: new Date(body.start),
          end: new Date(body.end),
          status: "Beklemede",
          details: body.details,
          creatorId: body.creatorId,
          creatorInsId: body.creatorInsId,
        },
      });

      // 2. Alt kalemleri oluştur
      const requestSubPromises = body.requestSub.map((sub: any) =>
        tx.requestSub.create({
          data: {
            requiredDate: new Date(sub.requiredDate),
            serviceId: sub.serviceId,
            quantity: sub.quantity,
            detail: sub.detail,
            offerRequestId: offerRequest.id,
          },
        })
      );

      await Promise.all(requestSubPromises);

      // 3. Duyuru oluştur
      const announcement = await tx.announcements.create({
        data: {
          title: "Yeni Teklif Talebi",
          description: `${body.details} (Talep ID: ${offerRequest.id})`,
          date: new Date(),
          creatorId: body.creatorId,
          creatorInsId: body.creatorInsId,
        }
      });

      return {
        offerRequest,
        announcement
      };
    });

    // Log kaydı oluştur - İlk OfferRequests tablosu için
    let logUserId = userId;
    
    // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
    if (!logUserId) {
      console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      
      if (adminUser) {
        console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
        // OfferRequests için log
        await createLogEntry(adminUser.id, "EKLE", "OfferRequests", headersList);
        // Announcements için de log
        await createLogEntry(adminUser.id, "EKLE", "Announcements", headersList);
      } else {
        console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          console.log(`Kullanıcı bulundu: ${anyUser.id}`);
          // OfferRequests için log
          await createLogEntry(anyUser.id, "EKLE", "OfferRequests", headersList);
          // Announcements için de log
          await createLogEntry(anyUser.id, "EKLE", "Announcements", headersList);
        } else {
          console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
        }
      }
    } else {
      // Kullanıcı ID'si var, doğrudan kullan
      // OfferRequests için log
      await createLogEntry(logUserId, "EKLE", "OfferRequests", headersList);
      // Announcements için de log
      await createLogEntry(logUserId, "EKLE", "Announcements", headersList);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Teklif talebi oluşturma hatası:', error);
    return new NextResponse('Teklif talebi oluşturulurken bir hata oluştu', { status: 500 });
  }
}

// GET metodu değişmedi
export async function GET() {
  try {
    const offerRequests = await prisma.offerRequests.findMany({
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

    return NextResponse.json(offerRequests);
  } catch (error) {
    console.error('Teklif talepleri getirme hatası:', error);
    return new NextResponse('Teklif talepleri alınırken bir hata oluştu', { status: 500 });
  }
}