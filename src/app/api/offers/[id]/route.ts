// app/api/offers/[id]/route.ts
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
    const offer = await prisma.offerCards.findUnique({
      where: {
        id: params.id
      },
      include: {
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
        paymentTerm: true,
        OfferSub: {
          include: {
            service: true
          }
        }
      }
    });

    if (!offer) {
      return new NextResponse('Teklif bulunamadı', { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Teklif getirme hatası:', error);
    return new NextResponse('Teklif alınırken bir hata oluştu', { status: 500 });
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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mevcut alt kalemleri sil
      await tx.offerSub.deleteMany({
        where: {
          offerCardId: params.id
        }
      });

      // 2. Ana teklifi güncelle ve yeni alt kalemleri oluştur
      const updatedOffer = await tx.offerCards.update({
        where: {
          id: params.id
        },
        data: {
          offerDate: new Date(body.offerDate),
          validityDate: new Date(body.validityDate),
          status: body.status,
          details: body.details,
          paymentTermId: body.paymentTermId,
          creatorId: body.creatorId,
          creatorInsId: body.creatorInsId,
          recipientId: body.recipientId,
          recipientInsId: body.recipientInsId,
          OfferSub: {
            create: body.offerSub.map((sub: any) => ({
              servideId: sub.serviceId,
              unitPrice: parseFloat(sub.unitPrice),
              size: parseFloat(sub.size),
              detail: sub.detail
            }))
          }
        },
        include: {
          creator: true,
          creatorIns: true,
          recipient: true,
          recipientIns: true,
          paymentTerm: true,
          OfferSub: {
            include: {
              service: true
            }
          }
        }
      });

      return updatedOffer;
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
        await createLogEntry(adminUser.id, "GÜNCELLE", "OfferCards", headersList);
      } else {
        console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          console.log(`Kullanıcı bulundu: ${anyUser.id}`);
          await createLogEntry(anyUser.id, "GÜNCELLE", "OfferCards", headersList);
        } else {
          console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
        }
      }
    } else {
      // Kullanıcı ID'si var, doğrudan kullan
      await createLogEntry(logUserId, "GÜNCELLE", "OfferCards", headersList);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Teklif güncelleme hatası:', error);
    return new NextResponse('Teklif güncellenirken bir hata oluştu', { status: 500 });
  }
}

// DELETE metodu ekleyelim
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // İşlemi yapan kullanıcının ID'si
    const headersList = headers();

    // Silinecek teklifi önce bulalım (creatorId için)
    const offer = await prisma.offerCards.findUnique({
      where: {
        id: params.id
      }
    });

    if (!offer) {
      return new NextResponse('Teklif bulunamadı', { status: 404 });
    }

    // Transaction ile silme işlemi
    await prisma.$transaction(async (tx) => {
      // 1. Alt kalemleri sil
      await tx.offerSub.deleteMany({
        where: {
          offerCardId: params.id
        }
      });

      // 2. Ana teklifi sil
      await tx.offerCards.delete({
        where: {
          id: params.id
        }
      });
    });

    // Log kaydı oluştur
    let logUserId = userId || offer.creatorId;
    
    // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
    if (!logUserId) {
      console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      
      if (adminUser) {
        console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
        await createLogEntry(adminUser.id, "SİL", "OfferCards", headersList);
      } else {
        console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          console.log(`Kullanıcı bulundu: ${anyUser.id}`);
          await createLogEntry(anyUser.id, "SİL", "OfferCards", headersList);
        } else {
          console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
        }
      }
    } else {
      // Kullanıcı ID'si var, doğrudan kullan
      await createLogEntry(logUserId, "SİL", "OfferCards", headersList);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Teklif silme hatası:', error);
    return new NextResponse(`Teklif silinirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, { status: 500 });
  }
}