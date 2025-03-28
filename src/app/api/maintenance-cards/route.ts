import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Debug için form verisini logla
        console.log("[MAINTENANCE_CARDS_POST] Gelen form verisi:", body);

        const {
            deviceId,
            deviceTypeId,
            deviceFeatureId,
            providerId,
            providerInsId,
            customerId,
            customerInsId,
            maintenanceDate,
            nextMaintenanceDate,
            details,
            operations
        } = body;

        // Zorunlu alanları kontrol et
        const requiredFields = {
            deviceId,
            deviceTypeId,
            deviceFeatureId,
            providerId,
            providerInsId,
            customerId,
            customerInsId,
            maintenanceDate,
            nextMaintenanceDate,
            operations
        };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value) {
                return new NextResponse(JSON.stringify({
                    error: `${field} alanı zorunludur`
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Tarih kontrolü
        const maintenanceDateObj = new Date(maintenanceDate);
        const nextMaintenanceDateObj = new Date(nextMaintenanceDate);

        if (isNaN(maintenanceDateObj.getTime()) || isNaN(nextMaintenanceDateObj.getTime())) {
            return new NextResponse(JSON.stringify({
                error: "Geçersiz tarih formatı"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Operations array kontrolü
        if (!Array.isArray(operations) || operations.length === 0) {
            return new NextResponse(JSON.stringify({
                error: "En az bir işlem seçilmelidir"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Transaction ile ana kayıt ve alt kayıtları oluştur
        const result = await prisma.$transaction(async (prisma) => {
            // Debug log
            console.log("[MAINTENANCE_CARDS_POST] MaintenanceCard oluşturuluyor...");

            // MaintenanceCard oluştur
            const maintenanceCard = await prisma.maintenanceCards.create({
                data: {
                    deviceId,
                    deviceTypeId,
                    deviceFeatureId,
                    providerId,
                    providerInsId,
                    customerId,
                    customerInsId,
                    maintenanceDate: maintenanceDateObj,
                    nextMaintenanceDate: nextMaintenanceDateObj,
                    details: details || null
                }
            });

            console.log("[MAINTENANCE_CARDS_POST] MaintenanceCard oluşturuldu:", maintenanceCard);
            console.log("[MAINTENANCE_CARDS_POST] MaintenanceSub kayıtları oluşturuluyor...");

            // Seçilen her operation için MaintenanceSub kayıtları oluştur
            const maintenanceSubs = await Promise.all(
                operations.map(operationId => 
                    prisma.maintenanceSub.create({
                        data: {
                            maintenanceCardId: maintenanceCard.id,
                            operationId: operationId,
                            detail: null
                        }
                    })
                )
            );

            console.log("[MAINTENANCE_CARDS_POST] MaintenanceSub kayıtları oluşturuldu:", maintenanceSubs);

            return {
                maintenanceCard,
                maintenanceSubs
            };
        });

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("[MAINTENANCE_CARDS_POST] Hata:", error);
        
        return new NextResponse(JSON.stringify({
            error: "Bakım kartı oluşturulurken bir hata oluştu",
            details: error instanceof Error ? error.message : "Unknown error"
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Bakım kartlarını getir
export async function GET(request: Request) {
    try {
        const maintenanceCards = await prisma.maintenanceCards.findMany({
            include: {
                device: {
                    select: {
                        serialNumber: true,
                        type: true,
                        feature: true
                    }
                },
                deviceType: true,
                deviceFeature: true,
                provider: {
                    select: {
                        id: true,
                        name:true,
                    }
                },
                providerIns: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                customer: {
                    select: {
                        id: true,
                        name:true,
                    }
                },
                customerIns: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                MaintenanceSub: {
                    include: {
                        opreation: true
                    }
                }
            },
            orderBy: {
                maintenanceDate: 'desc'
            }
        });

        return NextResponse.json(maintenanceCards);
    } catch (error) {
        console.error("[MAINTENANCE_CARDS_GET]", error);
        
        return new NextResponse(JSON.stringify({
            error: "Bakım kartları getirilirken bir hata oluştu"
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new NextResponse(JSON.stringify({
                error: "Bakım kartı ID'si gerekli"
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Bakım kartını ve alt kayıtları kontrol et
        const maintenanceCard = await prisma.maintenanceCards.findUnique({
            where: { id },
            include: {
                MaintenanceSub: true
            }
        });

        if (!maintenanceCard) {
            return new NextResponse(JSON.stringify({
                error: "Bakım kartı bulunamadı"
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Transaction ile önce alt kayıtları sonra ana kaydı sil
        await prisma.$transaction(async (prisma) => {
            // Önce MaintenanceSub kayıtlarını sil
            if (maintenanceCard.MaintenanceSub.length > 0) {
                await prisma.maintenanceSub.deleteMany({
                    where: {
                        maintenanceCardId: id
                    }
                });
            }

            // Sonra MaintenanceCard'ı sil
            await prisma.maintenanceCards.delete({
                where: { id }
            });
        });

        return new NextResponse(JSON.stringify({
            message: "Bakım kartı ve ilişkili tüm kayıtlar başarıyla silindi"
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("[MAINTENANCE_CARDS_DELETE]", error);
        
        return new NextResponse(JSON.stringify({
            error: "Bakım kartı silinirken bir hata oluştu",
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}