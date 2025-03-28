// app/api/offers/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const offer = await prisma.offerCards.findUnique({
      where: {
        id: params.id
      },
      include: {
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
        paymentTerm: true,
        OfferSub: {
          include: {
            service: true
          }
        }
      }
    });

    if (!offer) {
      return new NextResponse('Teklif bulunamadı', { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Teklif getirme hatası:', error);
    return new NextResponse('Teklif alınırken bir hata oluştu', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mevcut alt kalemleri sil
      await tx.offerSub.deleteMany({
        where: {
          offerCardId: params.id
        }
      });

      // 2. Ana teklifi güncelle ve yeni alt kalemleri oluştur
      const updatedOffer = await tx.offerCards.update({
        where: {
          id: params.id
        },
        data: {
          offerDate: new Date(body.offerDate),
          validityDate: new Date(body.validityDate),
          status: body.status,
          details: body.details,
          paymentTermId: body.paymentTermId,
          creatorId: body.creatorId,
          creatorInsId: body.creatorInsId,
          recipientId: body.recipientId,
          recipientInsId: body.recipientInsId,
          OfferSub: {
            create: body.offerSub.map((sub: any) => ({
              servideId: sub.serviceId,
              unitPrice: parseFloat(sub.unitPrice),
              size: parseFloat(sub.size),
              detail: sub.detail
            }))
          }
        },
        include: {
          creator: true,
          creatorIns: true,
          recipient: true,
          recipientIns: true,
          paymentTerm: true,
          OfferSub: {
            include: {
              service: true
            }
          }
        }
      });

      return updatedOffer;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Teklif güncelleme hatası:', error);
    return new NextResponse('Teklif güncellenirken bir hata oluştu', { status: 500 });
  }
}