import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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

        if (!id) {
            return new NextResponse("ID gerekli", { status: 400 });
        }

        await prisma.isgMembers.delete({
            where: {
                id: id
            }
        });

        return new NextResponse("ISG Üyesi başarıyla silindi", { status: 200 });
    } catch (error) {
        console.log("[ISG_MEMBERS_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}