// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from "bcryptjs";
import { UserBloodType, UserSex, UserRole } from "@prisma/client";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const formData = await request.formData();

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
        const user = await prisma.user.findUnique({
            where: { id: params.id }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        await prisma.user.delete({
            where: { id: params.id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[USERS_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}