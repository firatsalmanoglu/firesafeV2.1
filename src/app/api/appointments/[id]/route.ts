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
    const headersList = headers();

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

    // userId olarak creatorId'yi kullanıyoruz (işlemi yapan kullanıcı olarak)
    const userId = body.creatorId;
    
    // userId yoksa veya geçersizse, bir admin kullanıcı bul
    if (!userId) {
      console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      
      if (adminUser) {
        console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
        await createLogEntry(adminUser.id, "GÜNCELLE", "Appointments", headersList);
      } else {
        console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          console.log(`Kullanıcı bulundu: ${anyUser.id}`);
          await createLogEntry(anyUser.id, "GÜNCELLE", "Appointments", headersList);
        } else {
          console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
        }
      }
    } else {
      // Kullanıcı ID'si var, doğrudan kullan
      await createLogEntry(userId, "GÜNCELLE", "Appointments", headersList);
    }

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
    const headersList = headers();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Silinecek randevuyu önce bul
    const appointment = await prisma.appointments.findUnique({
      where: {
        id: params.id,
      }
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Randevuyu sil
    await prisma.appointments.delete({
      where: {
        id: params.id,
      },
    });

    // userId yoksa, randevuyu oluşturan kullanıcıyı veya başka bir kullanıcıyı kullan
    if (!userId) {
      // İlk seçenek: Randevuyu oluşturan kullanıcı ID'sini kullan
      if (appointment.creatorId) {
        await createLogEntry(appointment.creatorId, "SİL", "Appointments", headersList);
      } else {
        // İkinci seçenek: Admin kullanıcı bul
        console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
        const adminUser = await prisma.user.findFirst({
          where: { role: "ADMIN" }
        });
        
        if (adminUser) {
          console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
          await createLogEntry(adminUser.id, "SİL", "Appointments", headersList);
        } else {
          // Son seçenek: Herhangi bir kullanıcı
          console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
          const anyUser = await prisma.user.findFirst();
          if (anyUser) {
            console.log(`Kullanıcı bulundu: ${anyUser.id}`);
            await createLogEntry(anyUser.id, "SİL", "Appointments", headersList);
          } else {
            console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
          }
        }
      }
    } else {
      // Kullanıcı ID'si var, doğrudan kullan
      await createLogEntry(userId, "SİL", "Appointments", headersList);
    }

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