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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const headersList = headers();
        const userId = body.userId; // İşlemi yapan kullanıcının ID'si

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

        // Log kaydı oluştur
        // Öncelikle userId veya providerId'yi kullan
        let logUserId = userId || body.providerId;
        
        // Eğer bu değerler yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
        if (!logUserId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                logUserId = adminUser.id;
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    logUserId = anyUser.id;
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        }
        
        // Kullanıcı ID'si bulunduysa log kaydı oluştur
        if (logUserId) {
            await createLogEntry(logUserId, "EKLE", "MaintenanceCards", headersList);
        }

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
        const userId = searchParams.get('userId'); // İşlemi yapan kullanıcının ID'si
        const headersList = headers();

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

        // Log kaydı oluştur
        // Öncelikle userId, yoksa providerId'yi kullan
        let logUserId = userId || maintenanceCard.providerId;
        
        // Eğer bu değerler yoksa, bir admin kullanıcı veya herhangi bir kullanıcı bul
        if (!logUserId) {
            console.log("userId bulunamadı, admin kullanıcısı aranıyor...");
            const adminUser = await prisma.user.findFirst({
                where: { role: "ADMIN" }
            });
            
            if (adminUser) {
                console.log(`Admin kullanıcısı bulundu: ${adminUser.id}`);
                logUserId = adminUser.id;
            } else {
                console.log("Admin kullanıcısı bulunamadı, herhangi bir kullanıcı aranıyor...");
                const anyUser = await prisma.user.findFirst();
                if (anyUser) {
                    console.log(`Kullanıcı bulundu: ${anyUser.id}`);
                    logUserId = anyUser.id;
                } else {
                    console.log("Hiç kullanıcı bulunamadı, log kaydı oluşturulamadı");
                }
            }
        }
        
        // Kullanıcı ID'si bulunduysa log kaydı oluştur
        if (logUserId) {
            await createLogEntry(logUserId, "SİL", "MaintenanceCards", headersList);
        }

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