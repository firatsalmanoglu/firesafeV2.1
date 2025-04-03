// app/api/users/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserBloodType, UserSex, UserRole } from "@prisma/client";
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
        const formData = await req.formData();
        const headersList = headers();
        const userIdFromRequest = formData.get('creatorUserId') as string; // İşlemi yapan kullanıcının ID'si
        
        console.log("Received Form Data:", Object.fromEntries(formData.entries())); 

        // Şifreyi hashle
        const password = formData.get('password') as string;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Fotoğraf varsa işle
        const photo = formData.get('photo') as File;
        let photoUrl = '';
        if (photo) {
            // Burada fotoğraf yükleme işlemini yapın
            // photoUrl = await uploadPhoto(photo);
        }

        // Tarih dönüşümünü güvenli bir şekilde yapalım
        const birthdayStr = formData.get('birthday') as string;
        const birthday = birthdayStr ? new Date(birthdayStr) : null;

        // Tarih geçerli mi kontrol edelim
        if (birthdayStr && isNaN(birthday!.getTime())) {
            return new NextResponse("Invalid date format", { status: 400 });
        }

        const bloodTypeValue = formData.get('bloodType') as string;
        const sexValue = formData.get('sex') as string;
        const roleValue = formData.get('role') as string;

        console.log("Creating user with data:", {
            userName: formData.get('userName'),
            email: formData.get('email'),
            bloodType: bloodTypeValue,
            sex: sexValue,
            institutionId: formData.get('institutionId'),
            roleId: formData.get('roleId'),
        });

        const user = await prisma.user.create({
            data: {
                email: formData.get('email') as string,
                password: hashedPassword,
                name: formData.get('name') as string || null,
                bloodType: bloodTypeValue ? bloodTypeValue as UserBloodType : null,
                birthday: birthday,
                sex: sexValue ? sexValue as UserSex : null,
                phone: formData.get('phone') as string || null,
                photo: photoUrl || null,
                institutionId: formData.get('institutionId') as string,
                role: roleValue ? roleValue as UserRole : 'GUEST',
            },
        });

        console.log("Created user:", user);

        // Log kaydı oluştur
        // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
        if (!userIdFromRequest) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "EKLE", "User", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "EKLE", "User", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(userIdFromRequest, "EKLE", "User", headersList);
        }

        return NextResponse.json(user);
    } catch (error) {
        console.log("[USERS_POST] Detailed error:", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const userIdFromRequest = searchParams.get('creatorUserId'); // İşlemi yapan kullanıcının ID'si
        const headersList = headers();

        if (!id) {
            return new NextResponse(JSON.stringify({
                error: "Kullanıcı ID'si gerekli"
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // İlişkili kayıtları kontrol et
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                CreatorOfferCards: true,
                RecipientOfferCards: true,
                ProviderMaintenanceCards: true,
                CustomerMaintenanceCards: true,
                CreatorAppointments: true,
                ProviderAppointments: true,
                CreatorNotifications: true,
                RecipientNotifications: true,
                CreatorAnnouncements: true,
                ProviderDevices: true,
                OwnerDevices: true,
                OfferRequests: true,
                Logs: true
            }
        });

        if (!user) {
            return new NextResponse(JSON.stringify({
                error: "Kullanıcı bulunamadı"
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // İlişkili kayıtları kontrol et
        const relatedRecords = {
            creatorOfferCards: user.CreatorOfferCards?.length || 0,
            recipientOfferCards: user.RecipientOfferCards?.length || 0,
            providerMaintenanceCards: user.ProviderMaintenanceCards?.length || 0,
            customerMaintenanceCards: user.CustomerMaintenanceCards?.length || 0,
            creatorAppointments: user.CreatorAppointments?.length || 0,
            providerAppointments: user.ProviderAppointments?.length || 0,
            creatorNotifications: user.CreatorNotifications?.length || 0,
            recipientNotifications: user.RecipientNotifications?.length || 0,
            creatorAnnouncements: user.CreatorAnnouncements?.length || 0,
            providerDevices: user.ProviderDevices?.length || 0,
            ownerDevices: user.OwnerDevices?.length || 0,
            offerRequests: user.OfferRequests?.length || 0,
            logs: user.Logs?.length || 0
        };

        const hasRelatedRecords = Object.values(relatedRecords).some(count => count > 0);

        if (hasRelatedRecords) {
            return new NextResponse(JSON.stringify({
                error: "Bu kullanıcının ilişkili kayıtları bulunmaktadır. Önce ilişkili kayıtları silmelisiniz.",
                relatedRecords
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // İlişkili kayıt yoksa kullanıcıyı sil
        await prisma.user.delete({
            where: { id }
        });

        // Log kaydı oluştur
        // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
        if (!userIdFromRequest) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "SİL", "User", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "SİL", "User", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(userIdFromRequest, "SİL", "User", headersList);
        }

        return new NextResponse(JSON.stringify({
            message: "Kullanıcı başarıyla silindi"
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("[USERS_DELETE]", error);
        
        return new NextResponse(JSON.stringify({
            error: "Kullanıcı silinirken bir hata oluştu",
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}