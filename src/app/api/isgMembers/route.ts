import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
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

export async function GET() {
    try {
        const members = await prisma.isgMembers.findMany({
            select: {
                id: true,
                name: true,
                isgNumber: true,
                contractDate: true, // Kontrat tarihini de getirelim
                institution: {
                    select: {
                        id: true,  // Kurum ID'sini de getirelim
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(members);
    } catch (error) {
        console.log("[ISG_MEMBERS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const headersList = headers();
        const userId = body.userId;
        
        // Kurum kontrolü
        const institutionExists = await prisma.institutions.findUnique({
            where: {
                id: body.institutionId
            }
        });

        if (!institutionExists) {
            return new NextResponse("Kurum bulunamadı", { status: 404 });
        }

        const isgMember = await prisma.isgMembers.create({
            data: {
                // id'yi kaldırdık - otomatik oluşturulacak
                isgNumber: body.isgNumber,
                name: body.name,
                contractDate: new Date(body.contractDate),
                institutionId: body.institutionId,
            },
            include: {
                institution: true, // İlişkili kurum bilgisini getir
                Devices: true     // İlişkili cihazları getir
            }
        });

        // userId yoksa veya geçersizse, bir admin kullanıcı bul
        if (!userId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "EKLE", "IsgMembers", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "EKLE", "IsgMembers", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(userId, "EKLE", "IsgMembers", headersList);
        }

        return NextResponse.json(isgMember);
    } catch (error) {
        console.log("[ISG_MEMBERS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// Güncelleme için PUT metodu da ekleyelim
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const headersList = headers();
        const userId = body.userId;
        
        // Kurum kontrolü
        const institutionExists = await prisma.institutions.findUnique({
            where: {
                id: body.institutionId
            }
        });

        if (!institutionExists) {
            return new NextResponse("Kurum bulunamadı", { status: 404 });
        }

        const isgMember = await prisma.isgMembers.update({
            where: {
                id: body.id // Güncellenecek kaydın ID'si
            },
            data: {
                isgNumber: body.isgNumber,
                name: body.name,
                contractDate: new Date(body.contractDate),
                institutionId: body.institutionId,
            },
            include: {
                institution: true,
                Devices: true
            }
        });

        // userId yoksa veya geçersizse, bir admin kullanıcı bul
        if (!userId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "GÜNCELLE", "IsgMembers", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "GÜNCELLE", "IsgMembers", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(userId, "GÜNCELLE", "IsgMembers", headersList);
        }

        return NextResponse.json(isgMember);
    } catch (error) {
        console.log("[ISG_MEMBERS_PUT]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// Silme için DELETE metodu da ekleyelim
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const userId = searchParams.get('userId');
        const headersList = headers();

        if (!id) {
            return new NextResponse("ID gerekli", { status: 400 });
        }

        await prisma.isgMembers.delete({
            where: {
                id: id
            }
        });

        // userId yoksa veya geçersizse, bir admin kullanıcı bul
        if (!userId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "SİL", "IsgMembers", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "SİL", "IsgMembers", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(userId, "SİL", "IsgMembers", headersList);
        }

        return new NextResponse("ISG Üyesi başarıyla silindi", { status: 200 });
    } catch (error) {
        console.log("[ISG_MEMBERS_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}