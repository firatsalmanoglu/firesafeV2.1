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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const id = searchParams.get('id');

        // Tek kurum sorgusu (id varsa)
        if (id) {
            const institution = await prisma.institutions.findUnique({
                where: { id },
                include: {
                    country: true,
                    city: true,
                    district: true,
                }
            });

            if (!institution) {
                return new NextResponse(JSON.stringify({
                    error: "Kurum bulunamadı"
                }), { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return NextResponse.json(institution);
        }

        // Kullanıcıya bağlı kurum sorgusu (userId varsa)
        if (userId) {
            const userInstitution = await prisma.$queryRaw`
                SELECT i.id, i.name, i.address, i.email, i.phone, i."registrationDate",
                       i."countryId", i."cityId", i."districtId"
                FROM "User" u
                JOIN "Institutions" i ON u."institutionId" = i.id
                WHERE u.id = ${userId}
            `;

            return NextResponse.json(userInstitution);
        }

        // Tüm kurumları getir (id ve userId yoksa)
        const institutions = await prisma.institutions.findMany({
            select: {
                id: true,
                name: true,
                address: true,
                email: true,
                phone: true,
                registrationDate: true,
                countryId: true,
                cityId: true,
                districtId: true,
                country: {
                    select: {
                        name: true
                    }
                },
                city: {
                    select: {
                        name: true
                    }
                },
                district: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(institutions);
    } catch (error) {
        console.log("[INSTITUTIONS_GET]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const headersList = headers();
        
        // Eğer userId yoksa veya geçersizse, ilk admin kullanıcıyı bul
        const userId = body.userId;
        
        let registrationDate = new Date();
        
        if (body.registrationDate) {
            const newDate = new Date(body.registrationDate);
            if (isNaN(newDate.getTime())) {
                return new NextResponse("Geçersiz tarih formatı", { status: 400 });
            }
            registrationDate = newDate;
        }
        
        // Kurum oluşturma işlemi
        const institutionData: any = {
            name: body.name,
            address: body.address,
            email: body.email,
            phone: body.phone,
            registrationDate: registrationDate,
        };

        // Ülke ilişkisi varsa ekle
        if (body.countryId) {
            institutionData.country = { connect: { id: body.countryId } };
        }

        // Şehir ilişkisi varsa ekle
        if (body.cityId) {
            institutionData.city = { connect: { id: body.cityId } };
        }

        // İlçe ilişkisi varsa ekle
        if (body.districtId) {
            institutionData.district = { connect: { id: body.districtId } };
        }

        // Kurum oluştur
        const institution = await prisma.institutions.create({
            data: institutionData,
        });

        // userId yoksa veya geçersizse, bir admin kullanıcı bul
        if (!userId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "EKLE", "Institutions", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "EKLE", "Institutions", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(userId, "EKLE", "Institutions", headersList);
        }

        return NextResponse.json(institution);
    } catch (error) {
        console.log("[INSTITUTIONS_POST]", error);
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse("Kurum oluşturulurken bir hata oluştu", { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const headersList = headers();
        
        // Kullanıcı kimliğini body'den alıyoruz
        const userId = body.userId;
        
        if (!body.id) {
            return new NextResponse("Kurum ID'si gerekli", { status: 400 });
        }

        const existingInstitution = await prisma.institutions.findUnique({
            where: { id: body.id }
        });

        if (!existingInstitution) {
            return new NextResponse("Kurum bulunamadı", { status: 404 });
        }

        let registrationDate = existingInstitution.registrationDate;
        
        if (body.registrationDate) {
            const newDate = new Date(body.registrationDate);
            if (isNaN(newDate.getTime())) {
                return new NextResponse("Geçersiz tarih formatı", { status: 400 });
            }
            registrationDate = newDate;
        }

        // Temel veri hazırlığı 
        const updateData: any = {
            name: body.name || existingInstitution.name,
            address: body.address || existingInstitution.address,
            email: body.email || existingInstitution.email,
            phone: body.phone || existingInstitution.phone,
            registrationDate: registrationDate,
        };

        // Ülke ilişkisi
        if (body.countryId) {
            updateData.country = { connect: { id: body.countryId } };
        } else if (body.countryId === null) {
            updateData.countryId = null;
        }

        // Şehir ilişkisi
        if (body.cityId) {
            updateData.city = { connect: { id: body.cityId } };
        } else if (body.cityId === null) {
            updateData.cityId = null;
        }

        // İlçe ilişkisi
        if (body.districtId) {
            updateData.district = { connect: { id: body.districtId } };
        } else if (body.districtId === null) {
            updateData.districtId = null;
        }

        const institution = await prisma.institutions.update({
            where: { id: body.id },
            data: updateData,
        });

        // userId yoksa veya geçersizse, bir admin kullanıcı bul
        if (!userId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "GÜNCELLE", "Institutions", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "GÜNCELLE", "Institutions", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(userId, "GÜNCELLE", "Institutions", headersList);
        }

        return NextResponse.json(institution);
    } catch (error) {
        console.log("[INSTITUTIONS_PUT]", error);
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse("Kurum güncellenirken bir hata oluştu", { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const userId = searchParams.get('userId');
        const headersList = headers();

        if (!id) {
            return new NextResponse(JSON.stringify({
                error: "ID gerekli"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Önce bağlı kayıtları kontrol et
        const users = await prisma.user.findMany({
            where: { institutionId: id }
        });

        if (users.length > 0) {
            return new NextResponse(JSON.stringify({
                error: "Bu kuruma bağlı kullanıcılar olduğu için silinemez"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Silme işlemini gerçekleştir
        await prisma.institutions.delete({
            where: { id }
        });

        // userId yoksa veya geçersizse, bir admin kullanıcı bul
        if (!userId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "SİL", "Institutions", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "SİL", "Institutions", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(userId, "SİL", "Institutions", headersList);
        }

        // Başarılı silme durumunda
        return new NextResponse(JSON.stringify({
            message: "Kurum başarıyla silindi"
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("[INSTITUTIONS_DELETE]", error);
        
        // Genel hata durumunda
        return new NextResponse(JSON.stringify({
            error: "Silme işlemi sırasında bir hata oluştu"
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}