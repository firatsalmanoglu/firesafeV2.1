// app/api/users/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserBloodType, UserSex, UserRole } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
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