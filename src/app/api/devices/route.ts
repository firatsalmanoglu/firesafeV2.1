// app/api/devices/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateQRCode } from "@/lib/utils/qrcode";
import { uploadPhoto } from "@/lib/utils/upload";
import { DeviceStatus } from "@prisma/client";
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
        const serialNumber = searchParams.get('serialNumber');
 
        // Eğer serialNumber ile arama yapılıyorsa
        if (serialNumber) {
            const device = await prisma.devices.findFirst({
                where: {
                    serialNumber: serialNumber
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
                return new NextResponse(JSON.stringify({
                    error: "Cihaz bulunamadı"
                }), { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
 
            return NextResponse.json(device);
        }
 
        // Mevcut tüm cihazları getirme kodu
        const devices = await prisma.devices.findMany({
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
            },
            orderBy: {
                serialNumber: 'asc'
            }
        });
 
        return NextResponse.json(devices);
    } catch (error) {
        console.error("[DEVICES_GET] Error:", error);
        
        if (error instanceof Error) {
            return new NextResponse(
                JSON.stringify({ error: error.message }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        return new NextResponse(
            JSON.stringify({ error: 'An unknown error occurred while fetching devices' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
 }

export async function POST(req: Request) {
   try {
       const formData = await req.formData();
       const headersList = headers();
       const creatorUserId = formData.get('creatorUserId') as string; // İşlemi yapan kullanıcının ID'si
       
       // Debug için form verisini logla
       console.log("API'ye gelen form verisi:", Object.fromEntries(formData.entries()));

       // Zorunlu alanları kontrol et
       const requiredFields = [
           'serialNumber',
           'typeId',
           'featureId',
           'productionDate',
           'lastControlDate',
           'expirationDate',
           'nextControlDate',
           'location',
           'location1',
           'currentStatus',
           'ownerId',
           'ownerInstId',
           'providerId',
           'providerInstId',
           'isgMemberId',
           'details'
       ];

       for (const field of requiredFields) {
           const value = formData.get(field);
           if (!value) {
               return new NextResponse(
                   `Missing required field: ${field}`,
                   { status: 400 }
               );
           }
       }

       // Fotoğraf yükleme
       const photo = formData.get('photo') as File;
       let photoUrl = '';
       if (photo && photo.size > 0) {
           try {
               photoUrl = await uploadPhoto(photo);
           } catch (uploadError) {
               console.error("Photo upload error:", uploadError);
               return new NextResponse(
                   'Error uploading photo: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error'),
                   { status: 400 }
               );
           }
       }

       // QR kod oluştur
       const serialNumber = formData.get('serialNumber') as string;
       let qrCode: string;
       try {
           qrCode = await generateQRCode(serialNumber);
       } catch (qrError) {
           console.error("QR code generation error:", qrError);
           return new NextResponse(
               'Error generating QR code: ' + (qrError instanceof Error ? qrError.message : 'Unknown error'),
               { status: 400 }
           );
       }

       // Tarihleri işle
       const dates = {
           productionDate: new Date(formData.get('productionDate') as string),
           lastControlDate: new Date(formData.get('lastControlDate') as string),
           expirationDate: new Date(formData.get('expirationDate') as string),
           nextControlDate: new Date(formData.get('nextControlDate') as string)
       };

       // Tarih validasyonu
       for (const [key, value] of Object.entries(dates)) {
           if (isNaN(value.getTime())) {
               return new NextResponse(
                   `Invalid date format for ${key}`,
                   { status: 400 }
               );
           }
       }

       // Enum validasyonu
       const status = formData.get('currentStatus') as DeviceStatus;
       if (!Object.values(DeviceStatus).includes(status)) {
           return new NextResponse(
               'Invalid device status',
               { status: 400 }
           );
       }

       // Device oluştur
       const device = await prisma.devices.create({
           data: {
               serialNumber,
               qrcode: qrCode,
               productionDate: dates.productionDate,
               lastControlDate: dates.lastControlDate,
               expirationDate: dates.expirationDate,
               nextControlDate: dates.nextControlDate,
               location: formData.get('location') as string,
               location1: formData.get('location1') as string,
               photo: photoUrl || null,
               currentStatus: status,
               typeId: formData.get('typeId') as string,
               featureId: formData.get('featureId') as string,
               ownerId: formData.get('ownerId') as string,
               ownerInstId: formData.get('ownerInstId') as string,
               providerId: formData.get('providerId') as string,
               providerInstId: formData.get('providerInstId') as string,
               isgMemberId: formData.get('isgMemberId') as string,
               details: formData.get('details') as string,
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

       // Log kaydı oluştur
       let logUserId = creatorUserId || formData.get('providerId') as string;
       
       // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
       if (!logUserId) {
           console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
           const adminUser = await prisma.user.findFirst({
               where: { role: "ADMIN" }
           });
           
           if (adminUser) {
               console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
               await createLogEntry(adminUser.id, "EKLE", "Devices", headersList);
           } else {
               console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
               const anyUser = await prisma.user.findFirst();
               if (anyUser) {
                   console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                   await createLogEntry(anyUser.id, "EKLE", "Devices", headersList);
               } else {
                   console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
               }
           }
       } else {
           // Kullanıcı ID'si var, doğrudan kullan
           await createLogEntry(logUserId, "EKLE", "Devices", headersList);
       }

       return NextResponse.json({
           success: true,
           data: device
       });

   } catch (error) {
       console.error("[DEVICES_POST] Detailed error:", error);
       
       if (error instanceof Error) {
           // Prisma hataları için özel kontrol
           if (error.name === 'PrismaClientKnownRequestError') {
               if ((error as any).code === 'P2002') {
                   return new NextResponse(
                       'A device with this serial number already exists',
                       { status: 400 }
                   );
               }
           }

           return new NextResponse(
               `Database error: ${error.message}`,
               { status: 500 }
           );
       }
       
       return new NextResponse(
           'An unknown error occurred while creating device',
           { status: 500 }
       );
   }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const creatorUserId = searchParams.get('creatorUserId'); // İşlemi yapan kullanıcının ID'si
        const headersList = headers();

        if (!id) {
            return new NextResponse(JSON.stringify({
                error: "Cihaz ID'si gerekli"
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Cihazı ve ilişkili kayıtları kontrol et
        const device = await prisma.devices.findUnique({
            where: { id },
            include: {
                MaintenanceCards: true,
                Notifications: true
            }
        });

        if (!device) {
            return new NextResponse(JSON.stringify({
                error: "Cihaz bulunamadı"
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // İlişkili kayıtları kontrol et
        const relatedRecords = {
            maintenanceCards: device.MaintenanceCards.length,
            notifications: device.Notifications.length
        };

        const hasRelatedRecords = Object.values(relatedRecords).some(count => count > 0);

        if (hasRelatedRecords) {
            return new NextResponse(JSON.stringify({
                error: "Bu cihaza ait bakım kartları veya bildirimler bulunmaktadır. Önce ilişkili kayıtları silmelisiniz.",
                relatedRecords
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // İlişkili kayıt yoksa, cihazı sil
        await prisma.devices.delete({
            where: { id }
        });

        // Log kaydı oluştur
        let logUserId = creatorUserId || device.providerId;
        
        // userId yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
        if (!logUserId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                await createLogEntry(adminUser.id, "SİL", "Devices", headersList);
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    await createLogEntry(anyUser.id, "SİL", "Devices", headersList);
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        } else {
            // Kullanıcı ID'si var, doğrudan kullan
            await createLogEntry(logUserId, "SİL", "Devices", headersList);
        }

        return new NextResponse(JSON.stringify({
            message: "Cihaz başarıyla silindi"
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("[DEVICES_DELETE]", error);
        
        return new NextResponse(JSON.stringify({
            error: "Cihaz silinirken bir hata oluştu",
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}