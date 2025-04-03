import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
    const headersList = headers();
    
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

    // Log kaydı oluştur - creatorId kullanıcı olarak kullan
    const userId = body.creatorId;
    
    // userId yoksa veya geçersizse, bir admin kullanıcı bul
    if (!userId) {
      console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      
      if (adminUser) {
        console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
        await createLogEntry(adminUser.id, "EKLE", "Appointments", headersList);
      } else {
        console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          console.log(`Kullanıcı bulundu: ${anyUser.id}`);
          await createLogEntry(anyUser.id, "EKLE", "Appointments", headersList);
        } else {
          console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
        }
      }
    } else {
      // Kullanıcı ID'si var, doğrudan kullan
      await createLogEntry(userId, "EKLE", "Appointments", headersList);
    }

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Randevu oluşturulurken hata:', error);
    return NextResponse.json(
      { error: 'Randevu oluşturulamadı' },
      { status: 500 }
    );
  }
}