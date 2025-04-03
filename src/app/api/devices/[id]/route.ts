// app/api/devices/[id]/route.ts
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
        const headersList = headers();
        const creatorUserId = formData.get('creatorUserId') as string; // İşlemi yapan kullanıcının ID'si

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

        // Log kaydı oluştur
        let logUserId = creatorUserId || updateData.providerId;
        
        // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
        if (!logUserId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "GÜNCELLE", "Devices", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "GÜNCELLE", "Devices", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(logUserId, "GÜNCELLE", "Devices", headersList);
        }

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