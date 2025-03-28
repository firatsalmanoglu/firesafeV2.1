import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const maintenance = await prisma.maintenanceCards.findUnique({
      where: {
        id: params.id
      },
      include: {
        device: {
          include: {
            type: true,
            feature: true,
            owner: true,
            ownerIns: true,
            provider: true,
            providerIns: true,
          }
        },
        MaintenanceSub: {
          include: {
            opreation: true
          }
        }
      }
    });

    if (!maintenance) {
      return new NextResponse('Bakım kartı bulunamadı', { status: 404 });
    }

    return NextResponse.json(maintenance);
  } catch (error) {
    console.error('Bakım kartı getirme hatası:', error);
    return new NextResponse('Bakım kartı alınırken bir hata oluştu', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Transaction ile güncelleme işlemi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mevcut alt işlemleri sil
      await tx.maintenanceSub.deleteMany({
        where: {
          maintenanceCardId: params.id
        }
      });

      // 2. Ana kaydı güncelle
      const maintenanceCard = await tx.maintenanceCards.update({
        where: {
          id: params.id
        },
        data: {
          deviceId: body.deviceId,
          deviceTypeId: body.deviceTypeId,
          deviceFeatureId: body.deviceFeatureId,
          providerId: body.providerId,
          providerInsId: body.providerInsId,
          customerId: body.customerId,
          customerInsId: body.customerInsId,
          maintenanceDate: new Date(body.maintenanceDate),
          nextMaintenanceDate: new Date(body.nextMaintenanceDate),
          details: body.details || null,
          MaintenanceSub: {
            create: body.operations.map((operationId: string) => ({
              operationId,
              detail: null
            }))
          }
        },
        include: {
          device: true,
          deviceType: true,
          deviceFeature: true,
          provider: true,
          providerIns: true,
          customer: true,
          customerIns: true,
          MaintenanceSub: {
            include: {
              opreation: true
            }
          }
        }
      });

      return maintenanceCard;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bakım kartı güncelleme hatası:', error);
    return new NextResponse('Bakım kartı güncellenirken bir hata oluştu', { status: 500 });
  }
}