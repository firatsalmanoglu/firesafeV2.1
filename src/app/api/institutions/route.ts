import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // Tüm kurumları getir (userId yoksa)
        if (!userId) {
            const institutions = await prisma.institutions.findMany({
                select: {
                    id: true,
                    name: true,
                    address: true,
                    email: true,
                    phone: true,
                    registrationDate: true,
                },
                orderBy: {
                    name: 'asc'
                }
            });
            return NextResponse.json(institutions);
        }

        // Kullanıcıya bağlı kurum sorgusu (userId varsa)
        const userInstitution = await prisma.$queryRaw`
            SELECT i.id, i.name, i.address, i.email, i.phone, i."registrationDate"
            FROM "User" u
            JOIN "Institutions" i ON u."institutionId" = i.id
            WHERE u.id = ${userId}
        `;

        return NextResponse.json(userInstitution);
    } catch (error) {
        console.log("[INSTITUTIONS_GET]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        let registrationDate = new Date();
        
        if (body.registrationDate) {
            const newDate = new Date(body.registrationDate);
            if (isNaN(newDate.getTime())) {
                return new NextResponse("Geçersiz tarih formatı", { status: 400 });
            }
            registrationDate = newDate;
        }
        
        const institution = await prisma.institutions.create({
            data: {
                name: body.name,
                address: body.address,
                email: body.email,
                phone: body.phone,
                registrationDate: registrationDate,
            },
        });

        return NextResponse.json(institution);
    } catch (error) {
        console.log("[INSTITUTIONS_POST]", error);
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse("Kurum oluşturulurken bir hata oluştu", { status: 500 });
    }
}


// Mevcut GET, POST ve PUT metodlarınızın altına ekleyin
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

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

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        
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

        const institution = await prisma.institutions.update({
            where: { id: body.id },
            data: {
                name: body.name,
                address: body.address,
                email: body.email,
                phone: body.phone,
                registrationDate: registrationDate,
            },
        });

        return NextResponse.json(institution);
    } catch (error) {
        console.log("[INSTITUTIONS_PUT]", error);
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse("Kurum güncellenirken bir hata oluştu", { status: 500 });
    }
}