// app/api/devices/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const device = await prisma.devices.findUnique({
            where: {
                id: params.id
            },
            include: {
                type: true,
                feature: true,
                owner: {
                    select: {
                        id: true,
                        name:true,
                    }
                },
                ownerIns: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                provider: {
                    select: {
                        id: true,
                        name:true,
                    }
                },
                providerIns: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                isgMember: {
                    select: {
                        id: true,
                        name: true,
                        isgNumber: true,
                    }
                }
            }
        });

        if (!device) {
            return new NextResponse(
                'Device not found',
                { status: 404 }
            );
        }

        return NextResponse.json(device);

    } catch (error) {
        console.error("[DEVICE_GET] Error:", error);
        
        if (error instanceof Error) {
            return new NextResponse(
                `Error: ${error.message}`,
                { status: 500 }
            );
        }
        
        return new NextResponse(
            'An unknown error occurred',
            { status: 500 }
        );
    }
}


export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const formData = await request.formData();

        const existingDevice = await prisma.devices.findUnique({
            where: { id }
        });

        if (!existingDevice) {
            return new NextResponse("Cihaz bulunamadı", { status: 404 });
        }

        // Tarih kontrolü
        const productionDate = formData.get('productionDate') ? new Date(formData.get('productionDate') as string) : null;
        const lastControlDate = formData.get('lastControlDate') ? new Date(formData.get('lastControlDate') as string) : null;
        const expirationDate = formData.get('expirationDate') ? new Date(formData.get('expirationDate') as string) : null;
        const nextControlDate = formData.get('nextControlDate') ? new Date(formData.get('nextControlDate') as string) : null;

        // Güncellenecek veriler
        const updateData: any = {
            serialNumber: formData.get('serialNumber') as string,
            typeId: formData.get('typeId') as string,
            featureId: formData.get('featureId') as string,
            productionDate: productionDate,
            lastControlDate: lastControlDate,
            expirationDate: expirationDate,
            nextControlDate: nextControlDate,
            location: formData.get('location') as string,
            location1: formData.get('location1') as string,
            currentStatus: formData.get('currentStatus') as "Aktif" | "Pasif",
            ownerId: formData.get('ownerId') as string,
            ownerInstId: formData.get('ownerInstId') as string,
            providerId: formData.get('providerId') as string,
            providerInstId: formData.get('providerInstId') as string,
            isgMemberId: formData.get('isgMemberId') as string,
            details: formData.get('details') as string || null,
        };

        // Fotoğraf varsa ekle
        const photo = formData.get('photo');
        if (photo instanceof File) {
            // Burada fotoğraf yükleme işlemi yapılabilir
            // updateData.photo = await uploadPhoto(photo);
        }

        const updatedDevice = await prisma.devices.update({
            where: { id },
            data: updateData,
            include: {
                type: true,
                feature: true,
                owner: {
                    select: {
                        id: true,
                        name:true,
                    }
                },
                ownerIns: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                provider: {
                    select: {
                        id: true,
                        name:true,
                    }
                },
                providerIns: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                isgMember: {
                    select: {
                        id: true,
                        name: true,
                        isgNumber: true,
                    }
                }
            }
        });

        return NextResponse.json(updatedDevice);
    } catch (error) {
        console.error("[DEVICES_PUT]", error);
        
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                return new NextResponse("Bu seri numarası zaten kullanımda", { status: 400 });
            }
            return new NextResponse(error.message, { status: 500 });
        }
        
        return new NextResponse("Cihaz güncellenirken bir hata oluştu", { status: 500 });
    }
}