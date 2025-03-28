// app/api/devices/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateQRCode } from "@/lib/utils/qrcode";
import { uploadPhoto } from "@/lib/utils/upload";
import { DeviceStatus } from "@prisma/client";

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