import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const offerRequest = await prisma.offerRequests.findUnique({
      where: {
        id: params.id,
      },
      include: {
        creator: true,
        creatorIns: true,
        RequestSub: {
          include: {
            service: true
          }
        }
      }
    });

    if (!offerRequest) {
      return new NextResponse('Teklif talebi bulunamadı', { status: 404 });
    }

    return NextResponse.json(offerRequest);
  } catch (error) {
    console.error('Teklif talebi getirme hatası:', error);
    return new NextResponse('Teklif talebi alınırken bir hata oluştu', { status: 500 });
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
      // 1. Mevcut alt kalemleri sil
      await tx.requestSub.deleteMany({
        where: {
          offerRequestId: params.id
        }
      });

      // 2. Ana teklif talebini güncelle
      const offerRequest = await tx.offerRequests.update({
        where: {
          id: params.id
        },
        data: {
          start: new Date(body.start),
          end: new Date(body.end),
          status: body.status,
          details: body.details,
          creatorId: body.creatorId,
          creatorInsId: body.creatorInsId,
        }
      });

      // 3. Yeni alt kalemleri oluştur
      const requestSubPromises = body.requestSub.map((sub: any) =>
        tx.requestSub.create({
          data: {
            requiredDate: new Date(sub.requiredDate),
            serviceId: sub.serviceId,
            quantity: sub.quantity,
            detail: sub.detail,
            offerRequestId: params.id,
          }
        })
      );

      await Promise.all(requestSubPromises);

      return offerRequest;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Teklif talebi güncelleme hatası:', error);
    return new NextResponse('Teklif talebi güncellenirken bir hata oluştu', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Önce kaydın var olup olmadığını kontrol edelim
    const existingRequest = await prisma.offerRequests.findUnique({
      where: {
        id: params.id
      },
      include: {
        RequestSub: true
      }
    });

    if (!existingRequest) {
      return new NextResponse('Teklif talebi bulunamadı', { status: 404 });
    }

    // Transaction ile silme işlemi
    await prisma.$transaction(async (tx) => {
      // 1. Alt kalemleri sil
      await tx.requestSub.deleteMany({
        where: {
          offerRequestId: params.id
        }
      });

      // 2. Ana teklif talebini sil
      await tx.offerRequests.delete({
        where: {
          id: params.id
        }
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Teklif talebi silme hatası:', error);
    // Hata detayını görelim
    return new NextResponse(`Teklif talebi silinirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, { status: 500 });
  }
}