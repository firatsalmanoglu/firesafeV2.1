// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const formData = await request.formData();
        const headersList = headers();
        const userIdFromRequest = formData.get('creatorUserId') as string; // İşlemi yapan kullanıcının ID'si

        // Mevcut kullanıcıyı kontrol et
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return new NextResponse("Kullanıcı bulunamadı", { status: 404 });
        }

        // // Şifre kontrolü
        // let hashedPassword;
        // const password = formData.get('password') as string;
        // if (password && password !== existingUser.password) {
        //     hashedPassword = await bcrypt.hash(password, 10);
        // }

        // Tarih kontrolü
        const birthdayStr = formData.get('birthday') as string;
        const birthday = birthdayStr ? new Date(birthdayStr) : null;
        
        const institutionId = formData.get('institutionId') as string;

        // Güncellenecek veriler
        const updateData: any = {
            email: formData.get('email') as string,
            name: formData.get('name') as string || null,
            bloodType: formData.get('bloodType') as UserBloodType || null,
            birthday: birthday,
            sex: formData.get('sex') as UserSex || null,
            phone: formData.get('phone') as string || null,
            role: formData.get('role') as string,

            // Institution ilişkisini güncelle
            institution: institutionId ? {
                connect: {
                    id: institutionId
                }
            } : {
                disconnect: true
            }
        };

        // // Şifre varsa ekle
        // if (hashedPassword) {
        //     updateData.password = hashedPassword;
        // }

        // Fotoğraf varsa ekle
        const photo = formData.get('photo');
        if (photo instanceof File) {
            // Burada fotoğraf yükleme işlemi yapılabilir
            // updateData.photo = await uploadPhoto(photo);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                institution: true
            }
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
                await createLogEntry(adminUser.id, "GÜNCELLE", "User", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "GÜNCELLE", "User", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(userIdFromRequest, "GÜNCELLE", "User", headersList);
        }

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error("[USERS_PUT]", error);
        
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                return new NextResponse("Bu kullanıcı adı veya email zaten kullanımda", { status: 400 });
            }
        }
        
        return new NextResponse("Kullanıcı güncellenirken bir hata oluştu", { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                institution: true,
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("[USERS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const userIdFromRequest = searchParams.get('creatorUserId'); // İşlemi yapan kullanıcının ID'si
        const headersList = headers();

        const user = await prisma.user.findUnique({
            where: { id: params.id }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        await prisma.user.delete({
            where: { id: params.id }
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

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[USERS_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}